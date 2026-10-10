import test from "node:test";
import assert from "node:assert/strict";
import {ObjectiveDedicatedSessionBridge} from "../src/services/objective-dedicated-session-bridge.mjs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";

function harness({failFirstOpen=false,clock=()=>100000}={}){
 const rounds=new ServerObjectiveRoundsService({
  trustedServerIds:["host44"],clock
 });
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"reconcile-44",sectionId:"multiplayer",
  modeId:"objective",mapId:"original-square",serverId:"host44",
  runtimePhase:"warmup"});
 let outages=failFirstOpen?1:0, authorized=true;
 const store={
  latest:id=>persistence.latest(id),
  saveIfCurrent:(data,fence)=>{
   if(outages>0){outages--;return {ok:false,error:"temporary_session_store_outage"};}
   return persistence.saveIfCurrent(data,fence);
  }
 };
 const principal={instance:"internal-fixture"};
 const bridge=new ObjectiveDedicatedSessionBridge({
  rounds,persistence:store,authorizeServer:(p,id)=>
    authorized&&p===principal&&id==="host44",
  validateCapture:()=>true
 });
 const session=bridge.createServerSession({serverId:"host44",principal}).session;
 const input={matchId:"reconcile-44",mapId:"original-square",
  objectiveIds:["zone-a","zone-b"],
  players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}],
  maxPoints:50,durationMs:30000};
 return {rounds,persistence,session,input,
  failNext:()=>{outages++},revoke:()=>{authorized=false}};
}
test("failed opening checkpoint can be retried without opening a second round",()=>{
 const x=harness({failFirstOpen:true});
 const failed=x.session.openMatch(x.input);
 assert.equal(failed.error,"objective_checkpoint_reconciliation_required");
 assert.equal(x.rounds.snapshot(x.input.matchId).revision,1);
 assert.equal(x.persistence.latest(x.input.matchId).sequence,1);
 assert.equal(x.session.openMatch(x.input).error,
   "objective_checkpoint_reconciliation_required");
 assert.equal(x.session.readSync(x.input.matchId).error,
   "objective_checkpoint_reconciliation_required");
 const recovered=x.session.reconcileCheckpoint(x.input.matchId);
 assert.equal(recovered.ok,true);
 assert.equal(recovered.sessionSnapshot.sequence,2);
 assert.equal(x.rounds.snapshot(x.input.matchId).revision,1);
 assert.equal(x.session.reconcileCheckpoint(x.input.matchId).error,
   "no_pending_objective_checkpoint");
 assert.equal(x.session.beginRound(x.input.matchId,"begin").ok,true);
});
test("failure after capture freezes new mutations and retries exactly one checkpoint",()=>{
 const x=harness();
 const id=x.input.matchId;
 x.session.openMatch(x.input);
 x.session.beginRound(id,"begin");
 const before=x.persistence.latest(id).sequence;
 x.failNext();
 const capture={requestId:"first",playerId:"p1",objectiveId:"zone-a",points:10};
 const attempted=x.session.captureObjective(id,capture);
 assert.equal(attempted.error,"objective_checkpoint_reconciliation_required");
 assert.equal(attempted.persistenceError,"temporary_session_store_outage");
 assert.equal(x.rounds.snapshot(id).scores.alpha,10);
 const revision=x.rounds.snapshot(id).revision;
 assert.equal(x.session.captureObjective(id,{...capture,requestId:"second"}).error,
   "objective_checkpoint_reconciliation_required");
 assert.equal(x.rounds.snapshot(id).revision,revision);
 assert.equal(x.persistence.latest(id).sequence,before);
 const fixed=x.session.reconcileCheckpoint(id);
 assert.equal(fixed.ok,true);
 assert.equal(fixed.sessionSnapshot.sequence,before+1);
 assert.equal(x.session.captureObjective(id,capture).replay,true);
 assert.equal(x.persistence.latest(id).sequence,before+1);
});
test("terminal transition persists on replay-safe retry, not by issuing another close",()=>{
 const x=harness(),id=x.input.matchId;
 x.session.openMatch(x.input);
 x.session.beginRound(id,"start");
 x.failNext();
 const failed=x.session.closeRound(id,"end");
 assert.equal(failed.error,"objective_checkpoint_reconciliation_required");
 assert.equal(x.rounds.snapshot(id).phase,"cancelled");
 assert.equal(x.persistence.latest(id).terminal,false);
 assert.equal(x.session.beginRound(id,"again").error,
   "objective_checkpoint_reconciliation_required");
 assert.equal(x.session.reconcileCheckpoint(id).ok,true);
 assert.equal(x.persistence.latest(id).terminal,true);
});
test("reassigned or revoked host cannot reconcile a pending checkpoint",()=>{
 const x=harness(),id=x.input.matchId;
 x.session.openMatch(x.input);
 x.failNext();
 x.session.beginRound(id,"start");
 x.persistence.save({matchId:id,sectionId:"multiplayer",
   modeId:"objective",mapId:"original-square",serverId:"another-server",
   runtimePhase:"active"});
 assert.equal(x.session.reconcileCheckpoint(id).error,
   "active_server_assignment_required");
 assert.equal(x.persistence.latest(id).serverId,"another-server");
 const y=harness();
 y.session.openMatch(y.input);y.failNext();
 y.session.beginRound(y.input.matchId,"start");y.revoke();
 assert.equal(y.session.reconcileCheckpoint(y.input.matchId).error,
   "dedicated_server_identity_revoked");
});
test("a failed capture at the deadline persists its server-owned expiration",()=>{
 let now=100000;
 const x=harness({clock:()=>now}),id=x.input.matchId;
 x.session.openMatch(x.input);
 x.session.beginRound(id,"begin");
 now+=30000;
 const rejected=x.session.captureObjective(id,{
  requestId:"too-late",playerId:"p1",objectiveId:"zone-a",points:10});
 assert.equal(rejected.error,"round_not_active");
 assert.equal(x.rounds.snapshot(id).phase,"expired");
 assert.equal(x.persistence.latest(id).terminal,true);
});
