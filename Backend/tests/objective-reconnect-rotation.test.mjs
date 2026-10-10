import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { ObjectiveLiveGateway } from "../src/services/objective-live-gateway.mjs";
import { ObjectiveSessionIssuer } from "../src/services/objective-session-issuer.mjs";
import { ObjectiveIdentityGate } from "../src/services/objective-identity-gate.mjs";
import { ObjectiveReconnectBridge } from "../src/services/objective-reconnect-bridge.mjs";
import { ServerObjectiveRoundsService } from "../src/services/server-objective-rounds.mjs";
import { SessionPersistenceService } from "../src/services/session-persistence.mjs";
import { handleObjectiveSessionIssuer } from "../src/routes/objective-session-issuer.mjs";
import { objectiveReconnectRotationContract } from "../src/objective-reconnect-rotation-contracts.mjs";
import { objectiveSessionContract } from "../src/objective-session-contracts.mjs";
import { makeServer } from "../src/server.mjs";

function setup() {
 let now=100000;
 const identity=new ObjectiveIdentityGate({
   issuer:"https://test.invalid",audience:"tfm-game-client",now:()=>now,
   verifyAccessToken:async token=>token==="verified-token-p1"
     ?{issuer:"https://test.invalid",audience:"tfm-game-client",
       subject:"p1",expiresAtMs:now+180000,verified:true}:null
 });
 const rounds=new ServerObjectiveRoundsService({trustedServerIds:["srv"],clock:()=>now});
 rounds.createServerAdapter("srv").adapter.open({
   matchId:"match-1",mapId:"map-1",objectiveIds:["a"],
   players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}]
 });
 const assignments={validate:(id,cred)=>id==="assign-1" && cred==="secret"
   ?{ok:true,assignment:{assignmentId:id,matchId:"match-1",
     serverId:"srv",expiresAt:"2099-01-01T00:00:00Z"}}
   :{ok:false,error:"invalid_join_credential"}};
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"match-1",serverId:"srv",modeId:"team-score",
   sectionId:"multiplayer",mapId:"map-1",runtimePhase:"warmup"});
 const bridge=new ObjectiveReconnectBridge({rounds,assignments,persistence,
   clock:()=>now,authorizeSubject:(principal,id)=>identity.authorize(principal,id)});
 const gateway=new ObjectiveLiveGateway({bridge,rounds,clock:()=>now});
 const issuer=new ObjectiveSessionIssuer({identity,gateway});
 const join={accessToken:"verified-token-p1",playerId:"p1",matchId:"match-1",
    assignmentId:"assign-1",joinCredential:"secret"};
 return {issuer,join,gateway,advance:ms=>{now+=ms}};
}
test("reissue rotates one-time reconnect token and creates a new scoped stream token",async()=>{
 const {issuer,join,gateway}=setup();
 const initial=await issuer.issue(join);
 assert.equal(initial.ok,true);
 const first=await issuer.reissue({
   accessToken:join.accessToken,playerId:"p1",reconnectToken:initial.reconnectToken});
 assert.equal(first.ok,true);
 assert.notEqual(first.viewerToken,initial.viewerToken);
 assert.notEqual(first.reconnectToken,initial.reconnectToken);
 assert.equal(gateway.attach({token:first.viewerToken,matchId:"another"}).error,
   "live_viewer_match_mismatch");
 const old=await issuer.reissue({
   accessToken:join.accessToken,playerId:"p1",reconnectToken:initial.reconnectToken});
 assert.equal(old.error,"reconnect_ticket_consumed");
 const second=await issuer.reissue({
   accessToken:join.accessToken,playerId:"p1",reconnectToken:first.reconnectToken});
 assert.equal(second.ok,true);
});
test("reconnect fails before mutation on impersonation, invalid token and cursor",async()=>{
 const {issuer,join}=setup();
 const initial=await issuer.issue(join);
 const bad=await issuer.reissue({
   accessToken:"invalid-token",playerId:"p1",reconnectToken:initial.reconnectToken});
 assert.equal(bad.error,"objective_identity_not_verified");
 const far=await issuer.reissue({
   accessToken:join.accessToken,playerId:"p1",
   reconnectToken:initial.reconnectToken,lastRevision:99999});
 assert.equal(far.error,"objective_cursor_ahead");
 const valid=await issuer.reissue({
   accessToken:join.accessToken,playerId:"p1",reconnectToken:initial.reconnectToken});
 assert.equal(valid.ok,true);
});
test("HTTP reconnect disallows assignment credentials and unverified identity",async t=>{
 const {issuer,join}=setup();
 const issued=await issuer.issue(join);
 const server=createServer(async(req,res)=>{
  const path=(req.url||"").split("?")[0];
  if(!(await handleObjectiveSessionIssuer(req,res,path,{
    issuer,contract:objectiveSessionContract})))res.writeHead(404).end();
 });
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 t.after(()=>server.close());
 const endpoint="http://127.0.0.1:"+server.address().port+"/v1/dev/objective-session/reconnect";
 const body={playerId:"p1",reconnectToken:issued.reconnectToken};
 const post=async(data,token="verified-token-p1")=>{
   const res=await fetch(endpoint,{method:"POST",headers:{
     authorization:"Bearer "+token,"content-type":"application/json"},
     body:JSON.stringify(data)});
   return {status:res.status,body:await res.json()};
 };
 assert.equal((await post({...body,assignmentId:"a"})).status,400);
 assert.equal((await post(body,"unsigned-client-token")).status,401);
 const good=await post(body);
 assert.equal(good.status,200);
 assert.equal(good.body.ok,true);
 assert.equal((await post(body)).status,401);
});
test("default app publishes contract, refuses unauthenticated token rotation",async t=>{
 const server=makeServer();
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 t.after(()=>server.close());
 const base="http://127.0.0.1:"+server.address().port;
 const contract=await fetch(base+"/v1/runtime/objective-reconnect-rotation");
 assert.equal((await contract.json()).bulk,37);
 assert.equal(objectiveReconnectRotationContract.invariants.length>0,true);
 const result=await fetch(base+"/v1/dev/objective-session/reconnect",{
   method:"POST",headers:{
     authorization:"Bearer unverifiable-bearer-token",
     "content-type":"application/json"
   },body:JSON.stringify({playerId:"p1",reconnectToken:"some-secret"})});
 assert.equal(result.status,401);
});
