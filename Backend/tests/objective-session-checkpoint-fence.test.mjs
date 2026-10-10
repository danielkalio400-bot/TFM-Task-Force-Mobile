import test from "node:test";
import assert from "node:assert/strict";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";
import {ObjectiveDedicatedSessionBridge} from "../src/services/objective-dedicated-session-bridge.mjs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";
import {makeServer} from "../src/server.mjs";

const seed=()=>{
 const store=new SessionPersistenceService();
 const saved=store.save({matchId:"match42",sectionId:"multiplayer",
  modeId:"objective",mapId:"courtyard",serverId:"s1",runtimePhase:"warmup"});
 assert.equal(saved.ok,true);
 return store;
};
const input=(s,phase="active")=>({
 matchId:"match42",sectionId:"multiplayer",modeId:"objective",mapId:"courtyard",
 serverId:s,runtimePhase:phase,terminal:["cancelled","expired","completed"].includes(phase)
});
test("compare-and-set accepts one owner and refuses stale replay without changing latest",()=>{
 const store=seed();
 const first=store.saveIfCurrent(input("s1"),{
  expectedSequence:1,expectedServerId:"s1",expectedMapId:"courtyard"});
 assert.equal(first.ok,true);
 assert.equal(first.snapshot.sequence,2);
 const before=store.latest("match42");
 assert.equal(store.saveIfCurrent(input("s1"),{
  expectedSequence:1,expectedServerId:"s1",expectedMapId:"courtyard"}).error,
  "session_checkpoint_stale");
 assert.deepEqual(store.latest("match42"),before);
 assert.equal(store.saveIfCurrent({...input("s1"),mapId:"different"},{
  expectedSequence:2,expectedServerId:"s1",expectedMapId:"courtyard"}).error,
  "session_checkpoint_reassigned");
 assert.deepEqual(store.latest("match42"),before);
});
test("terminal checkpoints and phase regression are fenced",()=>{
 const store=seed();
 const current=store.saveIfCurrent(input("s1"),{
  expectedSequence:1,expectedServerId:"s1",expectedMapId:"courtyard"});
 assert.equal(store.saveIfCurrent(input("s1","warmup"),{
  expectedSequence:current.snapshot.sequence,expectedServerId:"s1",
  expectedMapId:"courtyard"}).error,"session_checkpoint_phase_regression");
 const terminal=store.saveIfCurrent(input("s1","cancelled"),{
  expectedSequence:2,expectedServerId:"s1",expectedMapId:"courtyard"});
 assert.equal(terminal.ok,true);
 assert.equal(terminal.snapshot.terminal,true);
 assert.equal(store.saveIfCurrent(input("s1","active"),{
  expectedSequence:3,expectedServerId:"s1",expectedMapId:"courtyard"}).error,
  "session_checkpoint_terminal");
});
test("dedicated bridge uses only fenced checkpoint writes and rejects external stale session replacement",()=>{
 const store=seed(),principal={trusted:true};
 const rounds=new ServerObjectiveRoundsService({trustedServerIds:["s1"],clock:()=>100000});
 const bridge=new ObjectiveDedicatedSessionBridge({rounds,persistence:store,
  authorizeServer:(subject,srv)=>subject===principal&&srv==="s1"});
 const session=bridge.createServerSession({serverId:"s1",principal}).session;
 const open=session.openMatch({matchId:"match42",mapId:"courtyard",
  objectiveIds:["a"],players:[
   {playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}]});
 assert.equal(open.ok,true);
 assert.equal(store.latest("match42").sequence,2);
 // Independent host reassignment is not a proof of objective authority.
 store.save({...input("s1"),serverId:"s2"});
 assert.equal(session.beginRound("start").ok,false);
 assert.equal(store.latest("match42").serverId,"s2");
});
test("checkpoint policy can be inspected without public checkpoint mutation",async t=>{
 const server=makeServer();
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 t.after(()=>server.close());
 const origin="http://127.0.0.1:"+server.address().port;
 const r=await fetch(origin+"/v1/runtime/objective-session-checkpoint-fence");
 assert.equal(r.status,200);
 assert.equal((await r.json()).bulk,42);
 const unsafe=await fetch(origin+"/v1/dev/objective-rounds/match42",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({score:500})});
 assert.equal(unsafe.status,403);
});
