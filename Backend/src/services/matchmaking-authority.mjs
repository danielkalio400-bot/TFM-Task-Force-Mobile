import { randomUUID } from "node:crypto";

const PLATFORMS = new Set(["android", "ios", "windows"]);

export class MatchmakingAuthorityService {
  #tickets = new Map();
  #assignments = new Map();

  constructor({ policy, contract }) {
    this.policy = policy;
    this.contract = contract;
  }

  enqueue(input, nowMs = Date.now()) {
    const partyId = String(input?.partyId || "").trim();
    const sectionId = String(input?.sectionId || "").trim();
    const modeId = String(input?.modeId || "").trim();
    const platform = String(input?.platform || "").trim();
    const playerIds = Array.isArray(input?.playerIds)
      ? [...new Set(input.playerIds.map(value => String(value || "").trim()).filter(Boolean))]
      : [];
    const preferredRegions = Array.isArray(input?.preferredRegions)
      ? [...new Set(input.preferredRegions.map(value => String(value || "").trim()).filter(Boolean))]
      : [];
    const skillRating = Math.max(0, Math.trunc(Number(input?.skillRating) || 0));

    if (!partyId || !sectionId || !modeId || !PLATFORMS.has(platform) ||
        playerIds.length < 1 || playerIds.length > this.contract.defaults.maximumPartySize ||
        preferredRegions.length < 1)
      return { ok: false, error: "invalid_matchmaking_ticket" };

    const duplicate = [...this.#tickets.values()].find(ticket =>
      ticket.state === "searching" &&
      ticket.playerIds.some(playerId => playerIds.includes(playerId))
    );
    if (duplicate) return { ok: false, error: "player_already_searching" };

    const ticket = {
      ticketId: randomUUID(),
      partyId,
      sectionId,
      modeId,
      platform,
      playerIds,
      partySize: playerIds.length,
      preferredRegions,
      skillRating,
      allowCrossPlatform: input?.allowCrossPlatform !== false,
      state: "searching",
      matchId: "",
      createdAtMs: nowMs,
      createdAt: new Date(nowMs).toISOString(),
      expiresAtMs: nowMs + this.contract.defaults.maximumSearchSeconds * 1000,
      expiresAt: new Date(nowMs + this.contract.defaults.maximumSearchSeconds * 1000).toISOString(),
    };
    this.#tickets.set(ticket.ticketId, ticket);
    return { ok: true, ticket: structuredClone(ticket) };
  }

  expire(nowMs = Date.now()) {
    const expired = [];
    for (const ticket of this.#tickets.values()) {
      if (ticket.state === "searching" && nowMs >= ticket.expiresAtMs) {
        ticket.state = "expired";
        expired.push(ticket.ticketId);
      }
    }
    return expired;
  }

  run(nowMs = Date.now()) {
    this.expire(nowMs);
    const searching = [...this.#tickets.values()]
      .filter(ticket => ticket.state === "searching")
      .sort((a, b) => a.createdAtMs - b.createdAtMs || a.ticketId.localeCompare(b.ticketId));

    const used = new Set();
    const created = [];

    for (let i = 0; i < searching.length; i++) {
      const a = searching[i];
      if (used.has(a.ticketId)) continue;

      let selected = null;
      let decision = null;
      for (let j = i + 1; j < searching.length; j++) {
        const b = searching[j];
        if (used.has(b.ticketId)) continue;
        const candidateDecision = this.policy.evaluate(a, b, nowMs);
        if (!candidateDecision.compatible) continue;
        selected = b;
        decision = candidateDecision;
        break;
      }

      if (!selected || !decision) continue;

      const matchId = randomUUID();
      const assignment = {
        matchId,
        region: decision.region,
        sectionId: a.sectionId,
        modeId: a.modeId,
        ticketIds: [a.ticketId, selected.ticketId],
        playerIds: [...a.playerIds, ...selected.playerIds],
        partyIds: [a.partyId, selected.partyId],
        platforms: [...new Set([a.platform, selected.platform])],
        skillSpread: decision.skillSpread,
        allowedSkillDelta: decision.allowedSkillDelta,
        createdAt: new Date(nowMs).toISOString(),
      };

      for (const ticket of [a, selected]) {
        ticket.state = "matched";
        ticket.matchId = matchId;
        used.add(ticket.ticketId);
      }

      this.#assignments.set(matchId, assignment);
      created.push(structuredClone(assignment));
    }

    return { ok: true, assignments: created };
  }

  getTicket(ticketId) {
    const ticket = this.#tickets.get(String(ticketId || ""));
    return ticket ? structuredClone(ticket) : null;
  }

  getAssignment(matchId) {
    const assignment = this.#assignments.get(String(matchId || ""));
    return assignment ? structuredClone(assignment) : null;
  }

  cancel(ticketId) {
    const ticket = this.#tickets.get(String(ticketId || ""));
    if (!ticket) return { ok: false, error: "matchmaking_ticket_not_found" };
    if (ticket.state !== "searching")
      return { ok: false, error: "matchmaking_ticket_not_searching" };
    ticket.state = "cancelled";
    return { ok: true, ticket: structuredClone(ticket) };
  }

  stats() {
    const tickets = [...this.#tickets.values()];
    return {
      tickets: tickets.length,
      searching: tickets.filter(ticket => ticket.state === "searching").length,
      matched: tickets.filter(ticket => ticket.state === "matched").length,
      expired: tickets.filter(ticket => ticket.state === "expired").length,
      assignments: this.#assignments.size,
    };
  }
}
