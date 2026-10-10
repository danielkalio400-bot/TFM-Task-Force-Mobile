import {readJson,sendJson} from "../http/json.mjs";

export async function handleObjectiveSessionIssuer(req,res,path,{issuer,contract}) {
  if(req.method==="GET" && path==="/v1/runtime/objective-session-issuer") {
    sendJson(res,200,contract);return true;
  }
  if(path!=="/v1/dev/objective-session/viewer" &&
     path!=="/v1/dev/objective-session/reconnect")return false;
  if(req.method!=="POST") {
    sendJson(res,405,{error:"post_required"});return true;
  }
  const bearer=req.headers.authorization||"";
  if(!/^Bearer [^\s]{16,8192}$/.test(bearer)) {
    sendJson(res,401,{error:"validated_access_token_required"});return true;
  }
  try {
    const body=await readJson(req);
    if(!body || typeof body!=="object" || "principal" in body ||
      "signatureValidated" in body || "verified" in body) {
      sendJson(res,400,{error:"client_claims_not_accepted"});return true;
    }
    const isReconnect=path==="/v1/dev/objective-session/reconnect";
    if (isReconnect &&
        ("joinCredential" in body || "assignmentId" in body || "matchId" in body)) {
      sendJson(res,400,{error:"reconnect_credential_scope_invalid"});
      return true;
    }
    const result=isReconnect ? await issuer.reissue({
      accessToken:bearer.slice(7),playerId:body.playerId,
      reconnectToken:body.reconnectToken,
      lastRevision:body.lastRevision??0
    }) : await issuer.issue({
      accessToken:bearer.slice(7),playerId:body.playerId,
      matchId:body.matchId,assignmentId:body.assignmentId,
      joinCredential:body.joinCredential,lastRevision:body.lastRevision??0
    });
    res.setHeader("cache-control","no-store");
    sendJson(res,result.ok?200:401,result.ok?result:{error:result.error});
  } catch(error) {
    sendJson(res,400,{error:error?.code||"invalid_objective_session_request"});
  }
  return true;
}
