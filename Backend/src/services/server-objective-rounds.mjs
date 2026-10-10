import { randomUUID } from "node:crypto";

const trim = (value, max = 120) => typeof value === "string" &&
  value.trim() === value && value.length > 0 && value.length <= max &&
  [...value].every(character => character.charCodeAt(0) >= 32);
const validCount = value => Number.isSafeInteger(value) && value > 0 && value <= 1000;
const clone = value => structuredClone(value);
const rejected = error => ({ ok: false, error });
const phases = new Set(["warmup", "active", "completed", "expired", "cancelled"]);

/**
 * Dedicated-server integration boundary for a fictional objective round.
 * Only holders of a private in-process adapter may mutate match state.
 * No public REST action can register a server, accept a client score, or
 * send validated outcomes to player progression.
 */
export class ServerObjectiveRoundsService {
  #rounds = new Map();
  #trusted = new Set();
  #clock;
  #eventLimit;

  constructor({ trustedServerIds = [], clock = () => Date.now(), eventLimit = 2048 } = {}) {
    this.#trusted = new Set(trustedServerIds);
    this.#clock = clock;
    this.#eventLimit = eventLimit;
  }

  createServerAdapter(serverId) {
    if (!trim(serverId) || !this.#trusted.has(serverId))
      return rejected("untrusted_game_server");
    // Closure-held permission: the adapter itself is not exposed via HTTP.
    return {
      ok: true,
      adapter: Object.freeze({
        open: input => this.#open(serverId, input),
        begin: (roundId, requestId) => this.#begin(serverId, roundId, requestId),
        capture: (roundId, input) => this.#capture(serverId, roundId, input),
        close: (roundId, requestId) => this.#close(serverId, roundId, requestId, "cancelled"),
        advanceClock: roundId => this.#tick(serverId, roundId)
      })
    };
  }

  #timestamp() {
    const value = this.#clock();
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("invalid_authority_clock");
    return value;
  }

  #open(serverId, input) {
    const { matchId, mapId, objectiveIds, players, maxPoints = 100,
      durationMs = 300000 } = input || {};
    if (!trim(matchId) || !trim(mapId) || !Array.isArray(objectiveIds) ||
        objectiveIds.length < 1 || objectiveIds.length > 20 ||
        objectiveIds.some(id => !trim(id, 64)) ||
        new Set(objectiveIds).size !== objectiveIds.length ||
        !Array.isArray(players) || players.length < 2 || players.length > 64 ||
        players.some(p => !trim(p?.playerId) ||
          !["alpha", "bravo"].includes(p?.teamId)) ||
        new Set(players.map(p => p.playerId)).size !== players.length ||
        !players.some(p => p.teamId === "alpha") ||
        !players.some(p => p.teamId === "bravo") ||
        !validCount(maxPoints) || !Number.isSafeInteger(durationMs) ||
        durationMs < 30000 || durationMs > 3600000)
      return rejected("invalid_server_objective_round");
    const existing = this.#rounds.get(matchId);
    if (existing) return rejected("match_already_exists");
    const now = this.#timestamp();
    const state = {
      roundId: randomUUID(), matchId, mapId, serverId, phase: "warmup",
      players: players.map(p => ({ playerId:p.playerId, teamId:p.teamId })),
      objectives: [...objectiveIds], scores: { alpha:0, bravo:0 },
      maxPoints, durationMs, createdAtMs:now, startedAtMs:null, endedAtMs:null,
      winningTeamId:null, revision:0, nextSequence:1,
      events:[], applied:new Map()
    };
    this.#rounds.set(matchId, state);
    this.#append(state, "round-created", { objectiveCount: objectiveIds.length });
    return { ok:true, snapshot:this.#snapshot(state) };
  }

  #getOwned(serverId, matchId) {
    const round=this.#rounds.get(matchId);
    if (!round) return rejected("objective_round_not_found");
    if (round.serverId !== serverId) return rejected("wrong_game_server");
    return { ok:true, round };
  }

  #dedupe(round, requestId, fingerprint) {
    const old=round.applied.get(requestId);
    if (!old) return null;
    return old.fingerprint === fingerprint
      ? {ok:true, replay:true, snapshot:this.#snapshot(round)}
      : rejected("objective_request_conflict");
  }

  #begin(serverId, matchId, requestId) {
    const found=this.#getOwned(serverId,matchId);
    if (!found.ok) return found;
    const round=found.round;
    if (!trim(requestId)) return rejected("invalid_round_request_id");
    const duplicate=this.#dedupe(round,requestId,"begin");
    if (duplicate) return duplicate;
    if (round.phase !== "warmup") return rejected("round_not_in_warmup");
    round.phase="active";
    round.startedAtMs=this.#timestamp();
    round.applied.set(requestId,{fingerprint:"begin"});
    this.#append(round,"round-started",{});
    return {ok:true,snapshot:this.#snapshot(round),replay:false};
  }

  #capture(serverId,matchId,input) {
    const found=this.#getOwned(serverId,matchId);
    if (!found.ok) return found;
    const round=found.round;
    const {requestId,playerId,objectiveId,points=10}=input||{};
    if (!trim(requestId) || !trim(playerId) || !trim(objectiveId,64) ||
        !Number.isSafeInteger(points) || points < 1 || points > 20)
      return rejected("invalid_capture_event");
    const fingerprint=JSON.stringify([playerId,objectiveId,points]);
    const duplicate=this.#dedupe(round,requestId,fingerprint);
    if (duplicate) return duplicate;
    this.#expireIfNeeded(round);
    if (round.phase !== "active") return rejected("round_not_active");
    const player=round.players.find(p=>p.playerId===playerId);
    if (!player || !round.objectives.includes(objectiveId))
      return rejected("invalid_participant_or_objective");
    // Points are issued only by an already trusted server's event adapter.
    // Movement, trigger proof and collision still need real server physics.
    round.scores[player.teamId]=Math.min(round.maxPoints,round.scores[player.teamId]+points);
    round.applied.set(requestId,{fingerprint});
    this.#append(round,"objective-captured",{
      playerId,teamId:player.teamId,objectiveId,points
    });
    if (round.scores[player.teamId]>=round.maxPoints)
      this.#finalize(round,"completed",player.teamId);
    return {ok:true,snapshot:this.#snapshot(round),replay:false};
  }

  #close(serverId,matchId,requestId,phase) {
    const found=this.#getOwned(serverId,matchId);
    if (!found.ok) return found;
    const round=found.round;
    if (!trim(requestId)) return rejected("invalid_round_request_id");
    const duplicate=this.#dedupe(round,requestId,phase);
    if (duplicate) return duplicate;
    if (!["warmup","active"].includes(round.phase)) return rejected("round_already_closed");
    round.applied.set(requestId,{fingerprint:phase});
    this.#finalize(round,phase,null);
    return {ok:true,snapshot:this.#snapshot(round),replay:false};
  }

  #expireIfNeeded(round) {
    if (round.phase!=="active") return;
    if (this.#timestamp() - round.startedAtMs < round.durationMs) return;
    const winner=round.scores.alpha>round.scores.bravo ? "alpha":
      round.scores.bravo>round.scores.alpha ? "bravo" : null;
    this.#finalize(round,"expired",winner);
  }

  #tick(serverId,matchId) {
    const found=this.#getOwned(serverId,matchId);
    if (!found.ok) return found;
    this.#expireIfNeeded(found.round);
    return {ok:true,snapshot:this.#snapshot(found.round)};
  }

  #finalize(round,phase,winner) {
    if (!phases.has(phase)) throw new Error("invalid_round_state");
    round.phase=phase;
    round.winningTeamId=winner;
    round.endedAtMs=this.#timestamp();
    this.#append(round,"round-ended",{phase,winner});
  }

  #append(round,type,payload) {
    const item={sequence:round.nextSequence++,type,atMs:this.#timestamp(),...payload};
    round.revision=item.sequence;
    round.events.push(item);
    if (round.events.length>this.#eventLimit) round.events.shift();
  }

  #snapshot(round) {
    return clone({
      roundId:round.roundId,matchId:round.matchId,serverId:round.serverId,
      mapId:round.mapId,phase:round.phase,
      scores:round.scores,revision:round.revision,
      nextSequence:round.nextSequence,createdAtMs:round.createdAtMs,
      startedAtMs:round.startedAtMs,endedAtMs:round.endedAtMs,
      winningTeamId:round.winningTeamId,
      authoritativeSource:"in-process-dedicated-server-adapter",
      persistentResult:false,
      grantsProgression:false
    });
  }

  snapshot(matchId) {
    const round=this.#rounds.get(String(matchId||""));
    return round ? this.#snapshot(round) : null;
  }

  eventPage(matchId,{afterSequence=0,limit=50}={}) {
    const round=this.#rounds.get(String(matchId||""));
    if (!round) return null;
    if (!Number.isSafeInteger(afterSequence) || afterSequence<0 ||
        !Number.isSafeInteger(limit) || limit<1 || limit>100)
      return null;
    return {
      matchId,revision:round.revision,
      oldestSequence:round.events[0]?.sequence || round.nextSequence,
      events:clone(round.events.filter(e=>e.sequence>afterSequence).slice(0,limit))
    };
  }
}
