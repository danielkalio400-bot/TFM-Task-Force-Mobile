import test from "node:test";
import assert from "node:assert/strict";
import { ServerObjectiveRoundsService } from "../src/services/server-objective-rounds.mjs";
import { serverObjectiveRoundsContract } from "../src/server-objective-contracts.mjs";
import { makeServer } from "../src/server.mjs";

function make() {
  let now=100000;
  const rounds=new ServerObjectiveRoundsService({trustedServerIds:["server-a"],clock:()=>now});
  const adapter=rounds.createServerAdapter("server-a").adapter;
  return {rounds,adapter,advance:ms=>{now+=ms;}};
}
const basic=()=>({matchId:"test-one",mapId:"original-arena",objectiveIds:["north","south"],
  players:[{playerId:"one",teamId:"alpha"},{playerId:"two",teamId:"bravo"}],maxPoints:20,durationMs:30000});
test("untrusted server and invalid enrollment cannot start an objective match",()=>{
  const {rounds,adapter}=make();
  assert.equal(rounds.createServerAdapter("rogue").error,"untrusted_game_server");
  assert.equal(adapter.open({...basic(),players:[{playerId:"one",teamId:"alpha"}]}).error,"invalid_server_objective_round");
  assert.equal(adapter.open({...basic(),objectiveIds:["north","north"]}).error,"invalid_server_objective_round");
  assert.equal(adapter.open(basic()).ok,true);
  assert.equal(adapter.open(basic()).error,"match_already_exists");
  assert.equal(rounds.snapshot("test-one").scores.alpha,0);
});
test("trusted adapter validates capture, sequence, deduplication and immutable snapshots",()=>{
  const {rounds,adapter}=make();
  adapter.open(basic());
  adapter.begin("test-one","begin");
  assert.equal(adapter.capture("test-one",{requestId:"bad",playerId:"outsider",objectiveId:"north"}).error,"invalid_participant_or_objective");
  const payload={requestId:"e1",playerId:"one",objectiveId:"north",points:10};
  assert.equal(adapter.capture("test-one",payload).ok,true);
  assert.equal(adapter.capture("test-one",payload).replay,true);
  assert.equal(adapter.capture("test-one",{...payload,points:20}).error,"objective_request_conflict");
  const snap=rounds.snapshot("test-one");
  snap.scores.alpha=10000;
  assert.equal(rounds.snapshot("test-one").scores.alpha,10);
  const events=rounds.eventPage("test-one",{afterSequence:1});
  assert.deepEqual(events.events.map(x=>x.sequence),[2,3]);
  events.events[0].type="client-forged";
  assert.equal(rounds.eventPage("test-one",{afterSequence:1}).events[0].type,"round-started");
  assert.equal(rounds.snapshot("test-one").grantsProgression,false);
});
test("score cap completes match once without client-provided winner",()=>{
  const {rounds,adapter}=make();
  adapter.open(basic());adapter.begin("test-one","begin");
  adapter.capture("test-one",{requestId:"a",playerId:"one",objectiveId:"north",points:10});
  adapter.capture("test-one",{requestId:"b",playerId:"one",objectiveId:"south",points:10});
  assert.equal(rounds.snapshot("test-one").phase,"completed");
  assert.equal(rounds.snapshot("test-one").winningTeamId,"alpha");
  assert.equal(adapter.capture("test-one",{requestId:"c",playerId:"two",objectiveId:"north"}).error,"round_not_active");
  assert.deepEqual(rounds.eventPage("test-one",{afterSequence:3}).events.map(e=>e.type),["objective-captured","round-ended"]);
});
test("expiration and cancellation are clock-owned; invalid pages rejected",()=>{
  const {rounds,adapter,advance}=make();
  adapter.open(basic());adapter.begin("test-one","begin");
  advance(30000);
  assert.equal(adapter.capture("test-one",{requestId:"late",playerId:"one",objectiveId:"north"}).error,"round_not_active");
  assert.equal(rounds.snapshot("test-one").phase,"expired");
  assert.equal(rounds.eventPage("test-one",{afterSequence:-1}),null);
  assert.equal(adapter.close("test-one","cancel").error,"round_already_closed");
  assert.equal(serverObjectiveRoundsContract.integrity.clientScoreSubmission,false);
});
test("HTTP accepts no client score mutation and offers read-only snapshots",async t=>{
  const server=makeServer();
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  t.after(()=>server.close());
  const base="http://127.0.0.1:"+server.address().port;
  const response=await fetch(base+"/v1/dev/objective-rounds/test-one",{method:"POST",
    headers:{"content-type":"application/json"},body:JSON.stringify({points:999})});
  assert.equal(response.status,403);
  const contract=await fetch(base+"/v1/runtime/server-objective-rounds");
  assert.equal((await contract.json()).bulk,33);
  const absent=await fetch(base+"/v1/dev/objective-rounds/test-one");
  assert.equal(absent.status,404);
});
