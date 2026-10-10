import test from "node:test";
import assert from "node:assert/strict";
import {ObjectiveIdentityGate} from "../src/services/objective-identity-gate.mjs";
import {ObjectiveSessionIssuer} from "../src/services/objective-session-issuer.mjs";
import {ObjectiveLiveGateway} from "../src/services/objective-live-gateway.mjs";
import {ObjectiveReconnectBridge} from "../src/services/objective-reconnect-bridge.mjs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";
import {handleObjectiveSessionIssuer} from "../src/routes/objective-session-issuer.mjs";
import {objectiveSessionContract} from "../src/objective-session-contracts.mjs";
import {makeServer} from "../src/server.mjs";
import {createServer} from "node:http";

function fixture() {
 const now=100000;
 const identity=new ObjectiveIdentityGate({
   issuer:"https://test-issuer.invalid",audience:"tfm-game-client",now:()=>now,
   verifyAccessToken:async(token)=>token==="signed-fixture-token"
     ?{issuer:"https://test-issuer.invalid",audience:"tfm-game-client",
       subject:"p1",expiresAtMs:now+90000,verified:true}:null
 });
 const rounds=new ServerObjectiveRoundsService({trustedServerIds:["srv"],clock:()=>now});
 rounds.createServerAdapter("srv").adapter.open({matchId:"m1",mapId:"test-map",
   objectiveIds:["a"],players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}]});
 const assignment={assignmentId:"a1",joinCredential:"local-secret",
   matchId:"m1",serverId:"srv",expiresAt:"2099-01-01T00:00:00Z"};
 const assignments={validate:(id,cred)=>id==="a1" && cred==="local-secret"
   ?{ok:true,assignment}:{ok:false,error:"invalid_join_credential"}};
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"m1",serverId:"srv",sectionId:"multiplayer",
   modeId:"team-score",mapId:"test-map",runtimePhase:"warmup"});
 const bridge=new ObjectiveReconnectBridge({rounds,assignments,persistence,
   clock:()=>now,authorizeSubject:(principal,playerId)=>identity.authorize(principal,playerId)});
 const gateway=new ObjectiveLiveGateway({bridge,rounds,clock:()=>now});
 const issuer=new ObjectiveSessionIssuer({identity,gateway});
 return {identity,issuer};
}
test("identity gate is deny-by-default and rejects forged objects",async()=>{
 const denied=new ObjectiveIdentityGate();
 assert.equal((await denied.verify("signed-fixture-token","p1")).ok,false);
 const {identity}=fixture();
 assert.equal(identity.authorize({subject:"p1",expiresAtMs:200000},"p1"),false);
 const checked=await identity.verify("signed-fixture-token","p1");
 assert.equal(checked.ok,true);
 assert.equal(identity.authorize(checked.principal,"p1"),true);
 assert.equal(identity.authorize(checked.principal,"p2"),false);
 assert.equal((await identity.verify("fake-token","p1")).ok,false);
 assert.equal((await identity.verify("signed-fixture-token","p2")).ok,false);
});
test("issued viewer requires cryptographically verified fixture, assignment and roster",async()=>{
 const {issuer}=fixture();
 const body={accessToken:"signed-fixture-token",playerId:"p1",matchId:"m1",
   assignmentId:"a1",joinCredential:"local-secret"};
 const bad=await issuer.issue({...body,joinCredential:"wrong"});
 assert.equal(bad.error,"invalid_join_credential");
 const good=await issuer.issue(body);
 assert.equal(good.ok,true);
 assert.equal(good.snapshot.phase,"warmup");
 assert.ok(good.viewerToken.length>=40);
 assert.notEqual(good.reconnectToken,good.viewerToken);
});
test("HTTP issuance does not accept forged signatureValidated claims or URL token",async t=>{
 const {issuer}=fixture();
 const server=createServer(async(req,res)=>{
   const path=(req.url||"").split("?")[0];
   if(!(await handleObjectiveSessionIssuer(req,res,path,{
     issuer,contract:objectiveSessionContract
   })))res.writeHead(404).end();
 });
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 t.after(()=>server.close());
 const base="http://127.0.0.1:"+server.address().port;
 const payload={playerId:"p1",matchId:"m1",assignmentId:"a1",
   joinCredential:"local-secret"};
 const post=async(body,auth="Bearer signed-fixture-token")=>{
   const r=await fetch(base+"/v1/dev/objective-session/viewer",{
     method:"POST",headers:{"authorization":auth,"content-type":"application/json"},
     body:JSON.stringify(body)
   });return {status:r.status,body:await r.json()};
 };
 assert.equal((await post({...payload,signatureValidated:true})).status,400);
 assert.equal((await post(payload,"Bearer unsigned-jwt-placeholder")).status,401);
 const success=await post(payload);
 assert.equal(success.status,200);
 assert.equal(success.body.ok,true);
 const contract=await fetch(base+"/v1/runtime/objective-session-issuer");
 assert.equal((await contract.json()).bulk,36);
});
test("default application never mints viewer capability without real BazID verifier",async t=>{
 const server=makeServer();
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 t.after(()=>server.close());
 const res=await fetch("http://127.0.0.1:"+server.address().port+"/v1/dev/objective-session/viewer",{
   method:"POST",headers:{"authorization":"Bearer unsigned-local-test-token",
      "content-type":"application/json"},
   body:JSON.stringify({playerId:"p1",matchId:"m1",assignmentId:"a1",joinCredential:"x"})
 });
 assert.equal(res.status,401);
 assert.equal((await res.json()).error,"objective_identity_not_verified");
});
