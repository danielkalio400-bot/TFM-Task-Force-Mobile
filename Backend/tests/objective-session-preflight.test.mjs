import test from "node:test";
import assert from "node:assert/strict";
import {ObjectiveDedicatedSessionBridge} from "../src/services/objective-dedicated-session-bridge.mjs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";
import {inspectObjectiveSessionIntegrity} from "../src/services/objective-session-integrity-report.mjs";
import {readFileSync} from "node:fs";
const fixture=()=>{
 const rounds=new ServerObjectiveRoundsService({trustedServerIds:["s43"],clock:()=>10000});
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"m43",mapId:"prototype-arena",serverId:"s43",
  sectionId:"multiplayer",modeId:"objective",runtimePhase:"warmup"});
 const principal={identity:"trusted-fixture"};
 const bridge=new ObjectiveDedicatedSessionBridge({rounds,persistence,
  authorizeServer:(identity,server)=>identity===principal&&server==="s43",
  validateCapture:()=>true});
 const open=()=>bridge.createServerSession({serverId:"s43",principal}).session;
 const data={matchId:"m43",mapId:"prototype-arena",objectiveIds:["zone"],
  players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}],
  maxPoints:50,durationMs:30000};
 return {rounds,persistence,bridge,open,data};
};
test("out-of-band checkpoint update blocks capture BEFORE scoreboard mutation",()=>{
 const x=fixture(),server=x.open();
 assert.equal(server.openMatch(x.data).ok,true);
 assert.equal(server.beginRound("m43","begin").ok,true);
 const revision=x.rounds.snapshot("m43").revision;
 const score=x.rounds.snapshot("m43").scores.alpha;
 // Same server, same map and phase, but a different checkpoint sequence.
 x.persistence.save({matchId:"m43",serverId:"s43",
  mapId:"prototype-arena",sectionId:"multiplayer",
  modeId:"objective",runtimePhase:"active"});
 const rejected=server.captureObjective("m43",{requestId:"capture",
  playerId:"p1",objectiveId:"zone",points:20});
 assert.equal(rejected.error,"objective_session_out_of_sync");
 assert.equal(x.rounds.snapshot("m43").revision,revision);
 assert.equal(x.rounds.snapshot("m43").scores.alpha,score);
 assert.equal(server.closeRound("m43","close").error,"objective_session_out_of_sync");
 assert.equal(server.advanceClock("m43").error,"objective_session_out_of_sync");
});
test("a new bridge may not take over an active objective round automatically",()=>{
 const x=fixture(),server=x.open();
 assert.equal(server.openMatch(x.data).ok,true);
 const foreign=new ObjectiveDedicatedSessionBridge({
  rounds:x.rounds,persistence:x.persistence,
  authorizeServer:()=>true,validateCapture:()=>true
 });
 const secondary=foreign.createServerSession({
  serverId:"s43",principal:{trusted:true}}).session;
 const before=x.rounds.snapshot("m43");
 assert.equal(secondary.beginRound("m43","fake-start").error,
  "objective_round_handoff_required");
 assert.deepEqual(x.rounds.snapshot("m43"),before);
});
test("operator integrity diagnostic distinguishes state from capabilities",()=>{
 const x=fixture(),server=x.open();
 server.openMatch(x.data);
 const status=inspectObjectiveSessionIntegrity({
  rounds:x.rounds,persistence:x.persistence,matchId:"m43"});
 assert.equal(status.aligned,true);
 assert.equal(status.status,"consistent");
 assert.equal(status.grantsProgression,false);
 assert.equal(JSON.stringify(status).includes("p1"),false);
 x.persistence.save({matchId:"m43",serverId:"s43",
  mapId:"prototype-arena",sectionId:"multiplayer",modeId:"objective",
  runtimePhase:"active"});
 assert.equal(inspectObjectiveSessionIntegrity({
  rounds:x.rounds,persistence:x.persistence,matchId:"m43"}).status,"phase_conflict");
 x.persistence.save({matchId:"m43",serverId:"other",
  mapId:"prototype-arena",sectionId:"multiplayer",modeId:"objective",
  runtimePhase:"warmup"});
 assert.equal(inspectObjectiveSessionIntegrity({
  rounds:x.rounds,persistence:x.persistence,matchId:"m43"}).status,"authority_conflict");
});
test("dedicated source retains fenced checkpoint persistence and default fail-closed capture",()=>{
 const src=readFileSync(new URL("../src/services/objective-dedicated-session-bridge.mjs",import.meta.url),"utf8");
 assert.match(src,/const ready=preflight\(matchId,session\)/);
 assert.ok(src.indexOf("const ready=preflight(matchId,session)")<
   src.indexOf("const done=fn(adapter,session)"));
 assert.match(src,/objective_round_handoff_required/);
 assert.match(src,/saveIfCurrent/);
});
