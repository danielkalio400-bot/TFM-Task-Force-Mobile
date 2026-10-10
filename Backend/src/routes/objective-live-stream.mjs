import { sendJson } from "../http/json.mjs";

export function resolveObjectiveStreamCursor(url, lastEventId) {
  const values=url.searchParams.getAll("afterSequence");
  if(values.length>1)return {ok:false,error:"duplicate_objective_cursor"};
  const supplied=values.length===1?values[0]:lastEventId;
  if(supplied===undefined || supplied===null || supplied==="")
    return {ok:true,afterSequence:0};
  // SSE Last-Event-ID and query cursor are decimal sequence numbers,
  // never floats, exponent notation, signs or oversized integers.
  if(typeof supplied!=="string" || !/^(0|[1-9][0-9]*)$/.test(supplied))
    return {ok:false,error:"invalid_objective_cursor"};
  const afterSequence=Number(supplied);
  if(!Number.isSafeInteger(afterSequence))
    return {ok:false,error:"invalid_objective_cursor"};
  if(values.length===1 && lastEventId!==undefined &&
     lastEventId!==null && lastEventId!=="" &&
     String(afterSequence)!==lastEventId)
    return {ok:false,error:"conflicting_objective_cursors"};
  return {ok:true,afterSequence};
}

const sse=(type,payload,id)=>"event: "+type+"\n"+
  (id===undefined?"":"id: "+id+"\n")+
  "data: "+JSON.stringify(payload)+"\n\n";

/**
 * Actual Node HTTP/1.1 SSE route, scoped to an in-process-issued bearer
 * capability. No HTTP endpoint issues a token or accepts scores.
 * Production must supply a separately authenticated BazID game session.
 */
export async function handleObjectiveLiveStream(req,res,path,
  {gateway,contract,pollIntervalMs=250}) {
  if(req.method==="GET" && path==="/v1/runtime/objective-live-stream") {
    sendJson(res,200,contract);return true;
  }
  const match=path.match(/^\/v1\/dev\/objective-live\/([^/]+)\/events$/);
  if(!match)return false;
  if(req.method!=="GET") {
    sendJson(res,405,{error:"live_stream_read_only"});return true;
  }
  let matchId;
  try{matchId=decodeURIComponent(match[1]);}
  catch{sendJson(res,400,{error:"invalid_match_id"});return true;}
  // Reject URL query tokens; credentials must be in Authorization header.
  const url=new URL(req.url||"/","http://localhost");
  if(url.searchParams.has("access_token")||url.searchParams.has("token")) {
    sendJson(res,400,{error:"url_tokens_forbidden"});return true;
  }
  const auth=req.headers.authorization||"";
  if(!/^Bearer [A-Za-z0-9_-]{40,128}$/.test(auth)) {
    sendJson(res,401,{error:"bearer_capability_required"});return true;
  }
  const cursor=resolveObjectiveStreamCursor(url,req.headers["last-event-id"]);
  if(!cursor.ok){
    sendJson(res,400,{error:cursor.error});return true;
  }
  const opened=gateway.attach({
    token:auth.slice(7),matchId,afterSequence:cursor.afterSequence
  });
  if(!opened.ok) {
    sendJson(res,opened.error==="live_viewer_match_mismatch"?403:401,
      {error:opened.error});
    return true;
  }
  res.writeHead(200,{
    "content-type":"text/event-stream; charset=utf-8",
    "cache-control":"no-store, no-transform",
    "connection":"keep-alive",
    "x-content-type-options":"nosniff",
    "x-accel-buffering":"no"
  });
  let lastSequence=opened.initial.nextSequence;
  let lastRevision=opened.initial.snapshot.revision;
  let closed=false;
  let heartbeatAt=Date.now();
  let timer;
  function cleanup() {
    if(closed)return;
    closed=true;
    if(timer)clearInterval(timer);
    opened.handle.release();
  }
  function finish(){cleanup();if(!res.destroyed)res.end();}
  function writeFrame(value) {
    if(closed || res.destroyed)return false;
    try {
      if(res.write(value))return true;
    } catch { /* Connection already closing. */ }
    // Never allow unbounded output buffers for a slow/disconnected viewer.
    // Client can reconnect with the last acknowledged sequence while the
    // short-lived stream capability remains valid.
    cleanup();
    res.destroy();
    return false;
  }
  res.on("close",cleanup);
  // Incoming HTTP GET requests complete before their SSE response does.
  // Do NOT treat req.close as a stream-close notification.
  if(!writeFrame(sse("snapshot",opened.initial,lastSequence)))return true;
  if(opened.initial.terminal && !opened.initial.hasMore){finish();return true;}

  timer=setInterval(()=>{
    if(closed)return;
    const update=opened.handle.read(lastSequence);
    if(!update.ok){
      if(writeFrame(sse("access-ended",{reason:update.error})))finish();
      return;
    }
    const next=update.frame;
    if(next.snapshot.revision!==lastRevision || next.resyncRequired ||
      next.events.length) {
      lastSequence=next.nextSequence;
      lastRevision=next.snapshot.revision;
      if(!writeFrame(sse(next.resyncRequired?"resync":"delta",next,lastSequence)))
        return;
    }
    if(next.terminal && !next.hasMore){finish();return;}
    if(Date.now()-heartbeatAt>=15000) {
      heartbeatAt=Date.now();
      if(!writeFrame(": keepalive\n\n"))return;
    }
  },pollIntervalMs);
  timer.unref?.();
  return true;
}
