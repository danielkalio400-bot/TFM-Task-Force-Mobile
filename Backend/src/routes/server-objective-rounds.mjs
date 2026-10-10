import { sendJson } from "../http/json.mjs";

export async function handleServerObjectiveRounds(request,response,path,{rounds,contract}) {
  if (request.method==="GET" && path==="/v1/runtime/server-objective-rounds") {
    sendJson(response,200,contract); return true;
  }
  // Deliberately no REST-based trusted server registration or score writes.
  if (path.startsWith("/v1/dev/objective-rounds") && request.method!=="GET") {
    sendJson(response,403,{error:"server_authority_required"}); return true;
  }
  const match=path.match(/^\/v1\/dev\/objective-rounds\/([^/]+)(\/events)?$/);
  if (request.method==="GET" && match) {
    let matchId;
    try {matchId=decodeURIComponent(match[1]);}
    catch {sendJson(response,400,{error:"invalid_match_id"});return true;}
    if (!match[2]) {
      const state=rounds.snapshot(matchId);
      sendJson(response,state?200:404,state||{error:"objective_round_not_found"});
      return true;
    }
    const url=new URL(request.url||"/","http://localhost");
    const after=Number(url.searchParams.get("afterSequence")||"0");
    const limit=Number(url.searchParams.get("limit")||"50");
    const page=rounds.eventPage(matchId,{afterSequence:after,limit});
    sendJson(response,page?200:404,page||{error:"invalid_objective_event_query"});
    return true;
  }
  return false;
}
