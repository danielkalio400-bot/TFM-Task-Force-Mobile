import test from "node:test";
import assert from "node:assert/strict";
import {ObjectiveServerLeaseMonitor} from "../src/services/objective-server-lease-monitor.mjs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";
import {ObjectiveDedicatedSessionBridge} from "../src/services/objective-dedicated-session-bridge.mjs";
import {makeServer} from "../src/server.mjs";

function fixture(){
 let now=10000,accepted=true;
 const rounds=new ServerObjectiveRoundsService({
  trustedServerIds:["authorized-server"],clock:()=>now
 });
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"match-lease",sectionId:"multiplayer",
  modeId:"objective",mapId:"original-yard",serverId:"authorized-server",
  runtimePhase:"warmup"});
 const principal=Object.freeze({id:"verified-fixture-principal"});
 const bridge=new ObjectiveDedicatedSessionBridge({
  rounds,persistence,
  authorizeServer:(subject,serverId)=>accepted &&
    subject===principal&&serverId==="authorized-server",
  validateCapture:()=>false
 });
 const monitor=new ObjectiveServerLeaseMonitor({
  bridge,persistence,clock:()=>now,leaseMs:2000,maxMatches:2
 });
 return {
  rounds,persistence,monitor,principal,
  later:ms=>{now+=ms},revoke:()=>{accepted=false},
  register:()=>monitor.register({matchId:"match-lease",
    serverId:"authorized-server",principal})
 };
}
function createRound(session){
 return session.openMatch({mapId:"original-yard",objectiveIds:["mid"],
  players:[{playerId:"one",teamId:"alpha"},{playerId:"two",teamId:"bravo"}],
  maxPoints:40,durationMs:60000});
}
test("lease registration requires verified principal and existing assigned match",()=>{
 const x=fixture();
 assert.equal(x.monitor.register({
  serverId:"authorized-server",matchId:"missing",principal:x.principal
 }).error,"active_dedicated_session_required");
 assert.equal(x.monitor.register({
  serverId:"authorized-server",matchId:"match-lease",principal:{id:"forged"}
 }).ok,false);
 const joined=x.register();
 assert.equal(joined.ok,true);
 assert.equal(x.register().error,"dedicated_match_already_registered");
 assert.equal(x.monitor.diagnostics().active,1);
});
test("a heartbeat renews within deadline and elapsed lease rejects all game actions",()=>{
 const x=fixture();
 const session=x.register().session;
 assert.equal(createRound(session).ok,true);
 assert.equal(session.beginRound("opening").ok,true);
 x.later(1500);
 const heartbeat=session.heartbeat();
 assert.equal(heartbeat.ok,true);
 x.later(1600);
 assert.equal(session.readSync({afterSequence:0}).ok,true);
 x.later(400);
 assert.equal(session.heartbeat().error,"dedicated_lease_expired");
 assert.equal(session.advanceClock().error,"dedicated_lease_expired");
 const sweep=x.monitor.sweepExpired();
 assert.equal(sweep.outcomes.length,1);
 assert.equal(sweep.outcomes[0].closed,true);
 assert.equal(x.rounds.snapshot("match-lease").phase,"cancelled");
 assert.equal(x.persistence.latest("match-lease").terminal,true);
 assert.equal(x.monitor.sweepExpired().outcomes.length,0);
 assert.equal(session.heartbeat().error,"dedicated_lease_closed");
});
test("revoked server identity prevents a previously issued lease from acting",()=>{
 const x=fixture();
 const session=x.register().session;
 assert.equal(createRound(session).ok,true);
 x.revoke();
 assert.equal(session.heartbeat().error,"dedicated_server_identity_revoked");
 assert.equal(session.beginRound("cannot-begin").error,
  "dedicated_server_identity_revoked");
 assert.equal(x.rounds.snapshot("match-lease").phase,"warmup");
});
test("objective memory bounds preserve replay detection and terminal ID isolation",()=>{
 const rounds=new ServerObjectiveRoundsService({
  trustedServerIds:["server"],clock:()=>123456,maxRounds:1,
  maxRequestRecords:2,eventLimit:2
 });
 const api=rounds.createServerAdapter("server").adapter;
 const basic=matchId=>({matchId,mapId:"scene",objectiveIds:["a","b"],
   players:[{playerId:"one",teamId:"alpha"},{playerId:"two",teamId:"bravo"}],
   durationMs:30000,maxPoints:100});
 assert.equal(api.open(basic("m1")).ok,true);
 assert.equal(api.open(basic("m2")).error,"objective_round_capacity");
 assert.equal(api.begin("m1","begin").ok,true);
 assert.equal(api.capture("m1",{
  requestId:"capture-a",playerId:"one",objectiveId:"a"
 }).ok,true);
 const page=rounds.eventPage("m1",{afterSequence:0});
 assert.equal(page.events.length,2);
 assert.equal(api.capture("m1",{
  requestId:"capture-b",playerId:"two",objectiveId:"a"
 }).error,"objective_request_capacity");
 assert.equal(api.capture("m1",{
  requestId:"capture-a",playerId:"one",objectiveId:"a"
 }).replay,true);
 assert.equal(api.close("m1","end").ok,true);
 assert.equal(rounds.diagnostics().terminal,1);
 assert.equal(rounds.diagnostics().rounds,1);
 assert.equal(api.open(basic("m1")).error,"match_already_exists");
});
test("no public endpoint exposes lease operations or server scoring",async t=>{
 const server=makeServer();
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 t.after(()=>server.close());
 const root="http://127.0.0.1:"+server.address().port;
 const contract=await fetch(root+"/v1/runtime/objective-server-lease-monitor");
 assert.equal((await contract.json()).bulk,41);
 const denied=await fetch(root+"/v1/dev/objective-rounds/test",{method:"POST"});
 assert.equal(denied.status,403);
});
