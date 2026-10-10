import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";
import {ObjectiveDedicatedSessionBridge} from "../src/services/objective-dedicated-session-bridge.mjs";
import {makeServer} from "../src/server.mjs";
const mk=()=>{
 const rounds=new ServerObjectiveRoundsService({trustedServerIds:["server-a"],clock:()=>100000});
 const adapter=rounds.createServerAdapter("server-a").adapter;
 const base={matchId:"m39",mapId:"arena",objectiveIds:["a","b"],
  players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}],
  maxPoints:50,durationMs:30000};
 adapter.open(base);adapter.begin("m39","start");
 return {rounds,adapter,base};
};
test("same-team capture cannot farm additional score with a new request ID",()=>{
 const {rounds,adapter}=mk();
 const one=adapter.capture("m39",{requestId:"alpha-1",playerId:"p1",objectiveId:"a",points:10});
 assert.equal(one.ok,true);
 assert.equal(one.snapshot.scores.alpha,10);
 const version=one.snapshot.revision;
 assert.equal(adapter.capture("m39",{requestId:"alpha-2",playerId:"p1",objectiveId:"a",points:20}).error,
  "objective_already_controlled");
 const after=rounds.snapshot("m39");
 assert.equal(after.revision,version);
 assert.equal(after.scores.alpha,10);
 assert.equal(after.objectiveOwners.a,"alpha");
 assert.deepEqual(after.controlledObjectives.find(x=>x.objectiveId==="a"),{objectiveId:"a",teamId:"alpha"});
 const recapture=adapter.capture("m39",{requestId:"bravo-1",playerId:"p2",objectiveId:"a",points:10});
 assert.equal(recapture.ok,true);
 assert.equal(recapture.snapshot.objectiveOwners.a,"bravo");
 assert.equal(adapter.capture("m39",{requestId:"bravo-2",playerId:"p2",objectiveId:"a",points:10}).error,
  "objective_already_controlled");
 const again=adapter.capture("m39",{requestId:"alpha-3",playerId:"p1",objectiveId:"a",points:10});
 assert.equal(again.ok,true);
 assert.equal(rounds.snapshot("m39").scores.alpha,20);
 assert.equal(adapter.capture("m39",{requestId:"alpha-3",playerId:"p1",objectiveId:"a",points:20}).error,
  "objective_request_conflict");
});
test("trusted session advanceClock without phase changes must not grow persisted sequence",()=>{
 const rounds=new ServerObjectiveRoundsService({trustedServerIds:["server-a"],clock:()=>100000});
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"m39",mapId:"arena",serverId:"server-a",
  sectionId:"multiplayer",modeId:"objective",runtimePhase:"warmup"});
 const principal={machine:"test-harness"};
 const integrated=new ObjectiveDedicatedSessionBridge({rounds,persistence,
  authorizeServer:(p,id)=>p===principal&&id==="server-a",
  validateCapture:()=>false}).createServerSession({serverId:"server-a",principal});
 assert.equal(integrated.ok,true);
 const session=integrated.session;
 const initial=session.openMatch({matchId:"m39",mapId:"arena",objectiveIds:["a"],
  players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}]});
 assert.equal(initial.ok,true);
 const before=initial.sessionSnapshot.sequence;
 for(let i=0;i<25;i++){
  const tick=session.advanceClock("m39");
  assert.equal(tick.ok,true);
  assert.equal(tick.unchanged,true);
  assert.equal(tick.sessionSnapshot.sequence,before);
 }
 const start=session.beginRound("m39","begin");
 assert.equal(start.sessionSnapshot.sequence,before+1);
 assert.equal(session.advanceClock("m39").sessionSnapshot.sequence,before+1);
});
test("contract exists, no public mutation; Unity DTO mirrors flat objective ownership",async t=>{
 const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
 const snapshot=readFileSync(new URL("Online/Objectives/TFMServerObjectiveSnapshot.cs",root),"utf8");
 assert.match(snapshot,/TFMObjectiveControlRecord\[\] controlledObjectives/);
 const server=makeServer();
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 t.after(()=>server.close());
 const base="http://127.0.0.1:"+server.address().port;
 const res=await fetch(base+"/v1/runtime/objective-control-integrity");
 assert.equal((await res.json()).bulk,39);
 const mutation=await fetch(base+"/v1/dev/objective-rounds/m39",{method:"POST"});
 assert.equal(mutation.status,403);
});
