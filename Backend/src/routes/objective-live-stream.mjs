import { sendJson } from "../http/json.mjs";

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
  const after=Number(url.searchParams.get("afterSequence")||"0");
  const opened=gateway.attach({token:auth.slice(7),matchId,afterSequence:after});
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
  function finish(){cleanup();res.end();}
  req.on("close",cleanup);
  res.on("close",cleanup);
  res.write(sse("snapshot",opened.initial,lastSequence));
  if(opened.initial.terminal && !opened.initial.hasMore){finish();return true;}

  timer=setInterval(()=>{
    if(closed)return;
    const update=opened.handle.read(lastSequence);
    if(!update.ok){
      res.write(sse("access-ended",{reason:update.error}));
      finish();return;
    }
    const next=update.frame;
    if(next.snapshot.revision!==lastRevision || next.resyncRequired ||
      next.events.length) {
      lastSequence=next.nextSequence;
      lastRevision=next.snapshot.revision;
      res.write(sse(next.resyncRequired?"resync":"delta",next,lastSequence));
    }
    if(next.terminal && !next.hasMore){finish();return;}
    if(Date.now()-heartbeatAt>=15000) {
      heartbeatAt=Date.now();
      res.write(": keepalive\n\n");
    }
  },pollIntervalMs);
  timer.unref?.();
  return true;
}
