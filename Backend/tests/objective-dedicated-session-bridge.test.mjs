import test from "node:test";
import assert from "node:assert/strict";
import {ObjectiveDedicatedSessionBridge} from "../src/services/objective-dedicated-session-bridge.mjs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";
import {makeServer} from "../src/server.mjs";
import {readFileSync} from "node:fs";
const setup=({maxEventLimit=16,allowPhysics=true}={})=>{
 let accepted=true;
 const rounds=new ServerObjectiveRoundsService({
  trustedServerIds:["dedicated-alpha","dedicated-beta"],eventLimit:maxEventLimit,
  clock:()=>100000
 });
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"match-38",serverId:"dedicated-alpha",
   sectionId:"multiplayer",modeId:"objective-team",mapId:"original-courtyard",
   runtimePhase:"creating-session",region:"local"});
 const principal={id:"sealed-instance",verifiedByHost:true};
 const bridge=new ObjectiveDedicatedSessionBridge({
  rounds,persistence,
  authorizeServer:(candidate,id)=>accepted && candidate===principal &&
    id==="dedicated-alpha",
  validateCapture:({event,mapId,serverId})=>allowPhysics &&
    mapId==="original-courtyard" && serverId==="dedicated-alpha" &&
    event?.serverOwnedEvidence==="sandbox-collider"
 });
 const open=()=>bridge.createServerSession({serverId:"dedicated-alpha",principal});
 const input={matchId:"match-38",mapId:"original-courtyard",
   objectiveIds:["checkpoint-a","checkpoint-b"],
   players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}],
   maxPoints:20,durationMs:30000};
 return {bridge,rounds,persistence,principal,open,input,
   revoke:()=>{accepted=false}};
};
test("unverified server principals and mismatched server IDs cannot own rounds",()=>{
 const x=setup();
 assert.equal(x.bridge.createServerSession({serverId:"dedicated-alpha",
  principal:{id:"sealed-instance",verifiedByHost:true}}).error,
  "dedicated_server_identity_not_verified");
 assert.equal(x.bridge.createServerSession({serverId:"dedicated-beta",
  principal:x.principal}).ok,false);
 const session=x.open().session;
 assert.equal(session.openMatch({...x.input,mapId:"unknown"}).error,
  "dedicated_match_map_mismatch");
 assert.equal(x.rounds.snapshot("match-38"),null);
});
test("server owned lifecycle syncs to existing session persistence with terminal flag",()=>{
 const x=setup();
 const session=x.open().session;
 const opening=session.openMatch(x.input);
 assert.equal(opening.ok,true);
 assert.equal(opening.snapshot.phase,"warmup");
 assert.equal(opening.sessionSnapshot.sequence,2);
 const begun=session.beginRound("match-38","begin-38");
 assert.equal(begun.ok,true);
 assert.equal(begun.sessionSnapshot.runtimePhase,"active");
 assert.equal(session.captureObjective("match-38",{
  requestId:"client-forged",playerId:"p1",objectiveId:"checkpoint-a",
  points:5,serverOwnedEvidence:"user-claim"
 }).error,"server_capture_validation_required");
 const legitimate=session.captureObjective("match-38",{
  requestId:"verified-1",playerId:"p1",objectiveId:"checkpoint-a",
  points:10,serverOwnedEvidence:"sandbox-collider"
 });
 assert.equal(legitimate.ok,true);
 assert.equal(legitimate.snapshot.scores.alpha,10);
 assert.equal(legitimate.snapshot.grantsProgression,false);
 assert.equal(legitimate.sessionSnapshot.sequence,4);
 const replay=session.captureObjective("match-38",{
  requestId:"verified-1",playerId:"p1",objectiveId:"checkpoint-a",
  points:10,serverOwnedEvidence:"sandbox-collider"
 });
 assert.equal(replay.ok,true);
 assert.equal(replay.replay,true);
 assert.equal(replay.sessionSnapshot.sequence,legitimate.sessionSnapshot.sequence);
 const ended=session.closeRound("match-38","close-38");
 assert.equal(ended.snapshot.phase,"cancelled");
 assert.equal(ended.sessionSnapshot.terminal,true);
 assert.equal(session.captureObjective("match-38",{
   requestId:"late",playerId:"p1",objectiveId:"checkpoint-a",
   serverOwnedEvidence:"sandbox-collider"
 }).error,"active_server_assignment_required");
});
test("revocation protects old capabilities from further server operations",()=>{
 const x=setup();
 const session=x.open().session;
 x.revoke();
 assert.equal(session.openMatch(x.input).error,"dedicated_server_identity_revoked");
 assert.equal(x.rounds.snapshot("match-38"),null);
});
test("unknown or stale objective cursors are rejected, retention gaps resync from snapshot",()=>{
 const x=setup({maxEventLimit:2});
 const session=x.open().session;
 session.openMatch(x.input);
 session.beginRound("match-38","begin");
 session.captureObjective("match-38",{requestId:"capture-1",
  playerId:"p1",objectiveId:"checkpoint-a",serverOwnedEvidence:"sandbox-collider"});
 const page=session.readSync("match-38",{afterSequence:0,limit:2});
 assert.equal(page.ok,true);
 assert.equal(page.frame.resyncRequired,true);
 assert.equal(page.frame.events.length,0);
 assert.equal(page.frame.nextSequence,x.rounds.snapshot("match-38").revision);
 assert.equal(session.readSync("match-38",{afterSequence:999}).error,
  "objective_cursor_ahead");
});
test("default transport describes dedicated boundary but exposes no score mutation",async t=>{
 const server=makeServer();
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 t.after(()=>server.close());
 const base="http://127.0.0.1:"+server.address().port;
 const contract=await fetch(base+"/v1/runtime/objective-dedicated-session-bridge");
 assert.equal(contract.status,200);
 assert.equal((await contract.json()).bulk,38);
 const mutation=await fetch(base+"/v1/dev/objective-rounds/match-38",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({points:999})
 });
 assert.equal(mutation.status,403);
});
test("Unity source has readonly snapshot and no progression mutation",()=>{
 const path=new URL("../../GameClient/StarterAssets/Assets/_TFM/Online/Objectives/TFMObjectiveDedicatedSyncState.cs",import.meta.url);
 const src=readFileSync(path,"utf8");
 assert.match(src,/state.revision<lastRevision/);
 assert.match(src,/eventSequence<lastEventSequence/);
 assert.doesNotMatch(src,/AwardXp|PlayerPrefs|ApplyDamage/);
});

test("Unity server snapshot and synchronization DTO share canonical round ID",()=>{
 const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
 const read=p=>readFileSync(new URL(p,root),"utf8");
 const snap=read("Online/Objectives/TFMServerObjectiveSnapshot.cs");
 const sync=read("Online/Objectives/TFMObjectiveDedicatedSyncState.cs");
 assert.match(snap,/public string roundId/);
 assert.match(sync,/state.roundId/);
});
