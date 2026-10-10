import { createHash, randomBytes } from "node:crypto";

const clone=structuredClone;
const valid = value=>typeof value==="string" && value.length>0 &&
  value.length<=160 && value.trim()===value &&
  [...value].every(x=>x.charCodeAt(0)>=32);
const digest=value=>createHash("sha256").update(value).digest("hex");
const deny=error=>({ok:false,error});

/**
 * Live read transport capability issuer, restricted to in-process callers
 * that can complete ObjectiveReconnectBridge.connect against an injected
 * authenticated-subject validator. NEVER expose issueViewer via public HTTP.
 * Tokens are scoped to one match and are stored as one-way hashes.
 */
export class ObjectiveLiveGateway {
  #bridge;
  #rounds;
  #clock;
  #ttlMs;
  #maxSessions;
  #sessions=new Map();

  constructor({bridge,rounds,clock=()=>Date.now(),ttlMs=60000,maxSessions=512}) {
    if(!bridge||!rounds || typeof bridge.connect!=="function" ||
      !Number.isSafeInteger(ttlMs)||ttlMs<1000||ttlMs>600000 ||
      !Number.isSafeInteger(maxSessions)||maxSessions<1||maxSessions>100000)
      throw new Error("invalid_live_gateway_dependencies");
    this.#bridge=bridge;
    this.#rounds=rounds;
    this.#clock=clock;
    this.#ttlMs=ttlMs;
    this.#maxSessions=maxSessions;
  }

  #now() {
    const now=this.#clock();
    if(!Number.isSafeInteger(now)||now<0)throw new Error("invalid_live_gateway_clock");
    return now;
  }

  #evict() {
    const now=this.#now();
    for(const [key,entry] of this.#sessions)
      if(entry.expiresAtMs<=now && !entry.active)this.#sessions.delete(key);
  }

  issueViewer(input) {
    this.#evict();
    if(this.#sessions.size>=this.#maxSessions)return deny("live_viewer_capacity");
    const linked=this.#bridge.connect(input);
    if(!linked.ok)return linked;
    const token=randomBytes(32).toString("base64url");
    this.#sessions.set(digest(token),{
      matchId:input.matchId,playerId:input.playerId,
      createdAtMs:this.#now(),expiresAtMs:this.#now()+this.#ttlMs,
      active:false
    });
    return {ok:true,viewerToken:token,expiresInMs:this.#ttlMs,
      reconnectToken:linked.reconnectToken,
      snapshot:linked.snapshot,nextSequence:linked.nextSequence,
      resyncRequired:linked.resyncRequired};
  }

  attach({token,matchId,afterSequence=0}={}) {
    if(!valid(token)||!valid(matchId) ||
       !Number.isSafeInteger(afterSequence)||afterSequence<0)
      return deny("invalid_live_stream_request");
    const entry=this.#sessions.get(digest(token));
    if(!entry)return deny("live_viewer_not_found");
    if(entry.matchId!==matchId)return deny("live_viewer_match_mismatch");
    if(entry.expiresAtMs<=this.#now())return deny("live_viewer_expired");
    if(entry.active)return deny("live_viewer_already_attached");
    const first=this.#read(entry,afterSequence);
    if(!first.ok)return first;
    entry.active=true;
    const handle=Object.freeze({
      read:cursor=>this.#readActive(entry,cursor),
      release:()=>{entry.active=false;}
    });
    return {ok:true,handle,initial:first.frame,expiresAtMs:entry.expiresAtMs};
  }

  #readActive(entry,cursor) {
    if(!entry.active)return deny("live_viewer_detached");
    if(entry.expiresAtMs<=this.#now())return deny("live_viewer_expired");
    return this.#read(entry,cursor);
  }

  #read(entry,cursor) {
    if(!Number.isSafeInteger(cursor)||cursor<0)
      return deny("invalid_live_stream_cursor");
    const snapshot=this.#rounds.snapshot(entry.matchId);
    if(!snapshot)return deny("objective_round_not_found");
    if(cursor>snapshot.revision)return deny("objective_cursor_ahead");
    const page=this.#rounds.eventPage(entry.matchId,{afterSequence:cursor,limit:100});
    if(!page)return deny("invalid_live_stream_cursor");
    const resyncRequired=page.oldestSequence>cursor+1;
    const events=resyncRequired?[]:page.events;
    const nextSequence=resyncRequired?snapshot.revision:
      (events.length?events[events.length-1].sequence:cursor);
    return {
      ok:true,
      frame:clone({
        snapshot,events,nextSequence,resyncRequired,
        hasMore:!resyncRequired && nextSequence<snapshot.revision,
        terminal:["completed","expired","cancelled"].includes(snapshot.phase),
        transport:"server-sent-events-dev",progressionGranted:false
      })
    };
  }
}
