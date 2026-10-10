const invalid=error=>({ok:false,error});
const clean=value=>typeof value==="string" && value.length>0 &&
  value.length<=160 && value.trim()===value &&
  [...value].every(c=>c.charCodeAt(0)>=32);
const terminal=new Set(["completed","expired","cancelled"]);
const copy=value=>structuredClone(value);

/**
 * In-process dedicated-server state adapter. The caller needs an explicitly
 * verified server principal, not a player-side assignment/join credential.
 * Real service-to-service cryptographic validation and gameplay physics must
 * be injected by production hosting: both default to DENY.
 */
export class ObjectiveDedicatedSessionBridge {
  #rounds;
  #persistence;
  #authorizeServer;
  #validateCapture;
  #bound=new Map();

  constructor({rounds,persistence,
    authorizeServer=()=>false,validateCapture=()=>false}={}) {
    if(!rounds||!persistence||typeof authorizeServer!=="function" ||
      typeof validateCapture!=="function")
      throw new Error("objective_server_integration_dependencies_required");
    this.#rounds=rounds;
    this.#persistence=persistence;
    this.#authorizeServer=authorizeServer;
    this.#validateCapture=validateCapture;
  }

  #verifyPrincipal(principal,serverId) {
    try{return this.#authorizeServer(principal,serverId)===true}
    catch{return false}
  }

  createServerSession({serverId,principal}={}) {
    if(!clean(serverId)||!this.#verifyPrincipal(principal,serverId))
      return invalid("dedicated_server_identity_not_verified");
    const trusted=this.#rounds.createServerAdapter(serverId);
    if(!trusted.ok)return invalid("dedicated_server_not_registered");

    // Retain this principal inside closure and revalidate it before every
    // operation. Revocation fails closed even on an old server session.
    const invoke=(matchId,fn)=>{
      if(!this.#verifyPrincipal(principal,serverId))
        return invalid("dedicated_server_identity_revoked");
      if(!clean(matchId))return invalid("invalid_dedicated_match");
      const snapshot=this.#persistence.latest(matchId);
      if(!snapshot || snapshot.terminal ||
        snapshot.serverId!==serverId || !clean(snapshot.mapId))
        return invalid("active_server_assignment_required");
      const current=this.#rounds.snapshot(matchId);
      if(current && (current.serverId!==serverId ||
        current.mapId!==snapshot.mapId))
        return invalid("dedicated_match_binding_mismatch");
      return fn(snapshot,trusted.adapter);
    };
    const persist=(matchId,session)=>{
      const current=this.#rounds.snapshot(matchId);
      if(!current || current.serverId!==serverId ||
        current.mapId!==session.mapId)
        return invalid("dedicated_match_binding_mismatch");
      const prior=this.#bound.get(matchId);
      if(prior && (prior.roundId!==current.roundId ||
         current.revision<prior.lastRevision))
        return invalid("dedicated_match_revision_regression");
      const terminalState=terminal.has(current.phase);
      const save=this.#persistence.save({
        matchId,sectionId:session.sectionId,modeId:session.modeId,
        mapId:session.mapId,region:session.region,serverId,
        runtimePhase:current.phase,terminal:terminalState
      });
      if(!save.ok)return save;
      this.#bound.set(matchId,{roundId:current.roundId,
        lastRevision:current.revision,lastSessionSequence:save.snapshot.sequence});
      return {ok:true,snapshot:current,sessionSnapshot:save.snapshot};
    };
    const apply=(matchId,fn)=>invoke(matchId,(session,adapter)=>{
      const done=fn(adapter,session);
      if(!done.ok)return done;
      const saved=persist(matchId,session);
      return saved.ok?{...saved,replay:Boolean(done.replay)}:saved;
    });

    const session=Object.freeze({
      openMatch:input=>apply(input?.matchId,(adapter,persisted)=>{
        if(!input || input.mapId!==persisted.mapId)
          return invalid("dedicated_match_map_mismatch");
        return adapter.open({
          matchId:input.matchId,mapId:persisted.mapId,
          objectiveIds:input.objectiveIds,players:input.players,
          durationMs:input.durationMs,maxPoints:input.maxPoints
        });
      }),
      beginRound:(matchId,requestId)=>apply(matchId,adapter=>
        adapter.begin(matchId,requestId)),
      captureObjective:(matchId,input)=>apply(matchId,(adapter,sessionState)=>{
        const state=this.#rounds.snapshot(matchId);
        if(!state || state.phase!=="active")return invalid("objective_round_not_active");
        // IMPORTANT: never accept a naked player-originated capture.
        // validateCapture must inspect server-owned collision/world state,
        // not merely a client-set {valid:true} flag.
        let verified=false;
        try {
          verified=this.#validateCapture({
            serverId,matchId,mapId:sessionState.mapId,
            revision:state.revision,roundId:state.roundId,
            event:input,principal
          })===true;
        }catch{/* fail closed */}
        if(!verified)return invalid("server_capture_validation_required");
        return adapter.capture(matchId,input);
      }),
      closeRound:(matchId,requestId)=>apply(matchId,adapter=>
        adapter.close(matchId,requestId)),
      advanceClock:matchId=>apply(matchId,adapter=>
        adapter.advanceClock(matchId)),
      readSync:(matchId,{afterSequence=0,limit=50}={})=>invoke(
        matchId,(_session,_adapter)=>{
          const snapshot=this.#rounds.snapshot(matchId);
          const page=this.#rounds.eventPage(matchId,{afterSequence,limit});
          if(!snapshot||!page)return invalid("invalid_objective_sync_cursor");
          if(afterSequence>snapshot.revision)
            return invalid("objective_cursor_ahead");
          const resyncRequired=page.oldestSequence>afterSequence+1;
          const events=resyncRequired?[]:page.events;
          const nextSequence=resyncRequired?snapshot.revision:
            (events.length?events[events.length-1].sequence:afterSequence);
          return {ok:true,frame:copy({
            snapshot,events,nextSequence,resyncRequired,
            hasMore:!resyncRequired && nextSequence<snapshot.revision,
            grantsProgression:false
          })};
        })
    });
    return {ok:true,session};
  }
}
