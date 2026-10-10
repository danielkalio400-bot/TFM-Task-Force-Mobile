import { createHash, randomBytes } from "node:crypto";

const copy=value=>structuredClone(value);
const clean=value=>typeof value==="string" && value.trim()===value &&
  value.length>0 && value.length<=160 && [...value].every(x=>x.charCodeAt(0)>=32);
const fail=error=>({ok:false,error});
const terminalPhase=new Set(["completed","expired","cancelled"]);
const tokenHash=value=>createHash("sha256").update(value).digest("hex");
const MAX_CURSOR=Number.MAX_SAFE_INTEGER;

/**
 * A local, in-process bridge between an allocated TFM session, the
 * server-owned objective scoreboard and the existing session persistence.
 * Injected authorizeSubject MUST verify the BazID-derived authenticated
 * subject in production. Missing authorization fails closed. Token material
 * is not exposed via any HTTP route.
 */
export class ObjectiveReconnectBridge {
  #rounds;
  #assignments;
  #persistence;
  #authorizeSubject;
  #clock;
  #lifetimeMs;
  #tickets = new Map();
  #maxTickets;

  constructor({rounds,assignments,persistence,
    authorizeSubject=()=>false,clock=()=>Date.now(),
    lifetimeMs=90000,maxTickets=1000}) {
    if(!rounds || !assignments || !persistence ||
      typeof authorizeSubject!=="function" ||
      !Number.isSafeInteger(lifetimeMs) || lifetimeMs<1000 || lifetimeMs>600000 ||
      !Number.isSafeInteger(maxTickets) || maxTickets<1 || maxTickets>50000)
      throw new Error("objective_reconnect_dependencies_invalid");
    this.#rounds=rounds;
    this.#assignments=assignments;
    this.#persistence=persistence;
    this.#authorizeSubject=authorizeSubject;
    this.#clock=clock;
    this.#lifetimeMs=lifetimeMs;
    this.#maxTickets=maxTickets;
  }

  #authorize(principal,playerId) {
    try {return this.#authorizeSubject(principal,playerId)===true;}
    catch {return false;}
  }

  #assignment(assignmentId,joinCredential,matchId) {
    if(!clean(assignmentId)||!clean(joinCredential)||!clean(matchId))
      return fail("invalid_match_join");
    const validated=this.#assignments.validate(assignmentId,joinCredential);
    if(!validated.ok)return fail(validated.error);
    if(validated.assignment.matchId!==matchId)return fail("assignment_match_mismatch");
    const latest=this.#persistence.latest(matchId);
    if(!latest||latest.serverId!==validated.assignment.serverId ||
      latest.matchId!==matchId||latest.terminal)
      return fail("active_session_snapshot_required");
    const trusted=this.#rounds.createServerAdapter(validated.assignment.serverId);
    if(!trusted.ok)return fail("objective_server_not_trusted");
    const roster=trusted.adapter.roster(matchId);
    if(!roster.ok)return roster;
    if(terminalPhase.has(roster.phase))return fail("objective_round_terminal");
    return {ok:true,assignment:validated.assignment,session:latest,roster};
  }

  #sync(matchId,lastRevision) {
    if(!Number.isSafeInteger(lastRevision)||lastRevision<0||lastRevision>MAX_CURSOR)
      return fail("invalid_objective_cursor");
    const snapshot=this.#rounds.snapshot(matchId);
    if(!snapshot)return fail("objective_round_not_found");
    if(lastRevision>snapshot.revision)return fail("objective_cursor_ahead");
    const page=this.#rounds.eventPage(matchId,{afterSequence:lastRevision,limit:100});
    if(!page)return fail("objective_event_page_unavailable");
    const resyncRequired=page.oldestSequence>lastRevision+1;
    const events=resyncRequired?[]:page.events;
    const nextSequence=events.length
      ?events[events.length-1].sequence:lastRevision;
    return {
      ok:true,
      view:{
        snapshot,events,
        resyncRequired,
        nextSequence:resyncRequired?snapshot.revision:nextSequence,
        hasMore:!resyncRequired && nextSequence<snapshot.revision,
        transport:"in-process-development-bridge",
        trustedAuthoritySource:snapshot.authoritativeSource,
        progressionGranted:false
      }
    };
  }

  connect({assignmentId,joinCredential,matchId,playerId,principal,lastRevision=0}={}) {
    if(!clean(playerId)||!this.#authorize(principal,playerId))
      return fail("objective_player_not_authorized");
    const linked=this.#assignment(assignmentId,joinCredential,matchId);
    if(!linked.ok)return linked;
    if(!linked.roster.players.some(item=>item.playerId===playerId))
      return fail("objective_player_not_enrolled");
    const view=this.#sync(matchId,lastRevision);
    if(!view.ok)return view;
    const now=this.#clock();
    if(!Number.isSafeInteger(now)||now<0)throw new Error("invalid_reconnect_clock");
    for(const [key,value] of this.#tickets)
      if(value.expiresAtMs<=now || value.consumed)this.#tickets.delete(key);
    if(this.#tickets.size>=this.#maxTickets)return fail("reconnect_ticket_capacity");
    const reconnectToken=randomBytes(32).toString("base64url");
    this.#tickets.set(tokenHash(reconnectToken),{
      assignmentId,matchId,playerId,
      serverId:linked.assignment.serverId,
      expiresAtMs:now+this.#lifetimeMs,consumed:false
    });
    return {
      ok:true,reconnectToken,expiresInMs:this.#lifetimeMs,
      assignmentId,playerId,
      sessionSequence:linked.session.sequence,
      ...view.view
    };
  }

  reconnect({reconnectToken,playerId,principal,lastRevision=0}={}) {
    if(!clean(reconnectToken)||!clean(playerId)||
      !this.#authorize(principal,playerId))
      return fail("objective_player_not_authorized");
    const digest=tokenHash(reconnectToken);
    const ticket=this.#tickets.get(digest);
    if(!ticket)return fail("reconnect_ticket_not_found");
    if(ticket.playerId!==playerId)return fail("reconnect_player_mismatch");
    if(ticket.consumed)return fail("reconnect_ticket_consumed");
    if(this.#clock()>=ticket.expiresAtMs)return fail("reconnect_ticket_expired");
    const latest=this.#persistence.latest(ticket.matchId);
    const snapshot=this.#rounds.snapshot(ticket.matchId);
    if(!latest||latest.terminal||latest.serverId!==ticket.serverId ||
      !snapshot||terminalPhase.has(snapshot.phase))
      return fail("objective_round_not_restorable");
    const trusted=this.#rounds.createServerAdapter(ticket.serverId);
    const roster=trusted.ok?trusted.adapter.roster(ticket.matchId):null;
    if(!roster?.ok || !roster.players.some(p=>p.playerId===playerId))
      return fail("objective_player_not_enrolled");
    const view=this.#sync(ticket.matchId,lastRevision);
    if(!view.ok)return view;
    // Rotate only after authorization and catch-up succeeded.
    // The previous secret remains a consumed tombstone for replay detection.
    const refreshedToken=randomBytes(32).toString("base64url");
    const refreshed={...ticket,expiresAtMs:this.#clock()+this.#lifetimeMs,
      consumed:false};
    ticket.consumed=true;
    this.#tickets.set(tokenHash(refreshedToken),refreshed);
    return {ok:true,matchId:ticket.matchId,playerId,
      reconnectToken:refreshedToken,expiresInMs:this.#lifetimeMs,
      sessionSequence:latest.sequence,...view.view};
  }

  syncSession({assignmentId,joinCredential,matchId}={}) {
    // Authoritative server-side integration only. No public route calls this.
    if(!clean(assignmentId)||!clean(joinCredential)||!clean(matchId))
      return fail("invalid_match_join");
    const verified=this.#assignments.validate(assignmentId,joinCredential);
    if(!verified.ok)return fail(verified.error);
    if(verified.assignment.matchId!==matchId)return fail("assignment_match_mismatch");
    const latest=this.#persistence.latest(matchId);
    if(!latest || latest.serverId!==verified.assignment.serverId)
      return fail("active_session_snapshot_required");
    const adapter=this.#rounds.createServerAdapter(verified.assignment.serverId);
    if(!adapter.ok || !adapter.adapter.roster(matchId).ok)
      return fail("objective_server_not_trusted");
    const round=this.#rounds.snapshot(matchId);
    const terminal=terminalPhase.has(round.phase);
    if(latest.runtimePhase===round.phase && latest.terminal===terminal)
      return {ok:true,snapshot:latest,replay:true};
    const saved=this.#persistence.save({
      matchId,sectionId:latest.sectionId,modeId:latest.modeId,mapId:latest.mapId,
      region:latest.region,serverId:latest.serverId,
      runtimePhase:round.phase,terminal
    });
    return saved.ok?{ok:true,snapshot:saved.snapshot,replay:false}:saved;
  }
}
