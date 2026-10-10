const denied=error=>({ok:false,error});
const clean=value=>typeof value==="string" && value.trim()===value &&
  value.length>0 && value.length<=160 &&
  [...value].every(character=>character.charCodeAt(0)>=32);
const methods=["openMatch","beginRound","captureObjective","closeRound",
  "advanceClock","readSync"];

/**
 * Process-local heartbeat and expiry boundary for a verified dedicated server.
 * It wraps the existing trusted ObjectiveDedicatedSessionBridge, never exposes
 * its underlying server adapter and never issues client tokens.
 *
 * Lease expiry is terminal for this monitor instance. Failed cleanup stays
 * pending so a host can retry it without renewing or reissuing authority.
 * The host must schedule sweepExpired(): no timer starts automatically.
 */
export class ObjectiveServerLeaseMonitor {
  #bridge;
  #persistence;
  #clock;
  #leaseMs;
  #maxMatches;
  #leases=new Map();
  #nextId=0;

  constructor({bridge,persistence,clock=()=>Date.now(),
    leaseMs=30000,maxMatches=512}={}) {
    if(!bridge||typeof bridge.createServerSession!=="function"||
       !persistence||typeof persistence.latest!=="function"||
       typeof clock!=="function" ||
       !Number.isSafeInteger(leaseMs)||leaseMs<1000||leaseMs>600000 ||
       !Number.isSafeInteger(maxMatches)||maxMatches<1||maxMatches>10000)
      throw new Error("invalid_dedicated_lease_configuration");
    this.#bridge=bridge;
    this.#persistence=persistence;
    this.#clock=clock;
    this.#leaseMs=leaseMs;
    this.#maxMatches=maxMatches;
  }

  #now() {
    const value=this.#clock();
    if(!Number.isSafeInteger(value)||value<0)
      throw new Error("invalid_server_lease_clock");
    return value;
  }

  #status(entry) {
    if(entry.state!=="active")return denied("dedicated_lease_closed");
    if(this.#now()>=entry.expiresAtMs)
      return denied("dedicated_lease_expired");
    return {ok:true};
  }

  register({serverId,matchId,principal}={}) {
    if(!clean(serverId)||!clean(matchId))
      return denied("invalid_dedicated_lease_registration");
    if(this.#leases.has(matchId))
      return denied("dedicated_match_already_registered");
    if(this.#leases.size>=this.#maxMatches)
      return denied("dedicated_lease_capacity");
    const assigned=this.#persistence.latest(matchId);
    if(!assigned||assigned.serverId!==serverId || assigned.terminal)
      return denied("active_dedicated_session_required");
    const connected=this.#bridge.createServerSession({serverId,principal});
    if(!connected.ok)return connected;
    const entry={
      serverId,matchId,principal,
      session:connected.session,
      expiresAtMs:this.#now()+this.#leaseMs,
      state:"active",id:++this.#nextId
    };
    this.#leases.set(matchId,entry);

    const invoke=(method,args)=>{
      const validity=this.#status(entry);
      if(!validity.ok)return validity;
      const assignment=this.#persistence.latest(matchId);
      if(!assignment||assignment.terminal||assignment.serverId!==serverId)
        return denied("dedicated_session_not_current");
      // Recheck host identity each operation; a revoked principal does not
      // keep privileges just because it previously held a lease.
      const auth=this.#bridge.createServerSession({serverId,principal});
      if(!auth.ok)return denied("dedicated_server_identity_revoked");
      if(method==="openMatch") {
        const input=args[0];
        if(!input || typeof input!=="object" || Array.isArray(input))
          return denied("invalid_dedicated_match_input");
        // openMatch accepts a single object, unlike follow-up operations.
        // Always inject the match identity bound to this lease.
        if(input.matchId!==undefined && input.matchId!==matchId)
          return denied("dedicated_match_mismatch");
        return entry.session.openMatch({...input,matchId});
      }
      return entry.session[method](matchId,...args);
    };
    const publicSession={
      heartbeat:()=>{
        const validity=this.#status(entry);
        if(!validity.ok)return validity;
        const auth=this.#bridge.createServerSession({serverId,principal});
        if(!auth.ok)return denied("dedicated_server_identity_revoked");
        const assignment=this.#persistence.latest(matchId);
        if(!assignment||assignment.terminal||assignment.serverId!==serverId)
          return denied("dedicated_session_not_current");
        entry.expiresAtMs=this.#now()+this.#leaseMs;
        return {ok:true,expiresAtMs:entry.expiresAtMs};
      },
      status:()=>({
        state:entry.state,expiresAtMs:entry.expiresAtMs,
        expired:entry.state!=="active" || this.#now()>=entry.expiresAtMs
      })
    };
    for(const method of methods)
      publicSession[method]=(...args)=>invoke(method,args);
    // This registration binds a specific match ID; no method accepts a
    // second arbitrary match ID from a caller.
    return {ok:true,session:Object.freeze(publicSession),
      expiresAtMs:entry.expiresAtMs};
  }

  sweepExpired() {
    const now=this.#now(),outcomes=[];
    for(const entry of this.#leases.values()) {
      if(entry.state==="closed" ||
         (entry.state==="active" && now<entry.expiresAtMs))continue;
      // The expired lease NEVER becomes active again, even if the server
      // identity is temporarily revoked and later reauthorized.
      const wasPending=entry.state==="cleanup-pending";
      entry.state="cleanup-pending";
      const id=entry.matchId;
      const snapshot=this.#persistence.latest(id);
      if(!snapshot){
        outcomes.push({matchId:id,closed:false,reason:"no_active_session"});
        continue;
      }
      if(snapshot.serverId!==entry.serverId){
        // Do not cancel a match that has since been reassigned.
        outcomes.push({matchId:id,closed:false,reason:"server_reassigned"});
        continue;
      }
      if(snapshot.terminal){
        entry.state="closed";
        outcomes.push({matchId:id,closed:true,reason:"already_terminal"});
        continue;
      }
      if(wasPending){
        // On a previous sweep the authoritative close may have succeeded
        // while its fenced session checkpoint failed. Reconcile only that
        // checkpoint, never repeat the scoring or the terminal event.
        const repaired=entry.session.reconcileCheckpoint(id);
        if(repaired.ok && repaired.sessionSnapshot?.terminal){
          entry.state="closed";
          outcomes.push({matchId:id,closed:true,reason:"terminal_reconciled"});
          continue;
        }
        if(!repaired.ok && repaired.error!=="no_pending_objective_checkpoint"){
          outcomes.push({matchId:id,closed:false,reason:repaired.error});
          continue;
        }
      }
      const closed=entry.session.closeRound(id,"lease-expiry-"+entry.id);
      if(closed.ok){
        entry.state="closed";
        outcomes.push({matchId:id,closed:true,reason:"cancelled"});
      }else {
        // A failed terminal checkpoint remains in the bridge pending ledger.
        // Next sweep will reconcile it; other failures stay visible to ops.
        outcomes.push({matchId:id,closed:false,reason:closed.error});
      }
    }
    return {ok:true,outcomes};
  }

  diagnostics() {
    let active=0,expired=0,pendingCleanup=0,completedCleanup=0;
    const now=this.#now();
    for(const entry of this.#leases.values()){
      if(entry.state==="closed"){
        completedCleanup++;
        expired++;
      }else if(entry.state==="cleanup-pending"){
        pendingCleanup++;
        expired++;
      }else if(now>=entry.expiresAtMs){
        pendingCleanup++;
        expired++;
      }else active++;
    }
    return Object.freeze({registered:this.#leases.size,active,expired,
      pendingCleanup,completedCleanup,maxMatches:this.#maxMatches});
  }
}
