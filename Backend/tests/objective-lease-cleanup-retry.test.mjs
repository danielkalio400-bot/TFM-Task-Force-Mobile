import test from "node:test";
import assert from "node:assert/strict";
import {ObjectiveServerLeaseMonitor} from "../src/services/objective-server-lease-monitor.mjs";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";
import {ObjectiveDedicatedSessionBridge} from "../src/services/objective-dedicated-session-bridge.mjs";

function fixture(){
 let now=50000,authorized=true,failWrites=0;
 const rounds=new ServerObjectiveRoundsService({
   trustedServerIds:["lease45"],clock:()=>now
 });
 const persistence=new SessionPersistenceService();
 const matchId="lease-retry-45";
 persistence.save({matchId,sectionId:"multiplayer",modeId:"objective",
   mapId:"arena45",serverId:"lease45",runtimePhase:"warmup"});
 const store={
   latest:id=>persistence.latest(id),
   saveIfCurrent:(value,precondition)=>{
     if(failWrites>0){failWrites--;
       return {ok:false,error:"checkpoint_store_unavailable"};}
     return persistence.saveIfCurrent(value,precondition);
   }
 };
 const principal=Object.freeze({host:"fixture"});
 const bridge=new ObjectiveDedicatedSessionBridge({
   rounds,persistence:store,
   authorizeServer:(p,id)=>authorized && p===principal && id==="lease45",
   validateCapture:()=>false
 });
 const monitor=new ObjectiveServerLeaseMonitor({
   bridge,persistence:store,clock:()=>now,leaseMs:2000
 });
 const joined=monitor.register({serverId:"lease45",matchId,principal});
 assert.equal(joined.ok,true);
 const session=joined.session;
 assert.equal(session.openMatch({mapId:"arena45",objectiveIds:["a"],
   players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}]}).ok,true);
 assert.equal(session.beginRound("begin").ok,true);
 return {rounds,persistence,session,monitor,matchId,
   expire:()=>{now+=2000},
   failNext:()=>{failWrites++},
   revoke:()=>{authorized=false},
   restore:()=>{authorized=true}
 };
}
test("expired close checkpoint outage keeps lease blocked until retry sync",()=>{
 const x=fixture();
 x.expire();
 x.failNext();
 const first=x.monitor.sweepExpired();
 assert.equal(first.outcomes.length,1);
 assert.equal(first.outcomes[0].closed,false);
 assert.equal(first.outcomes[0].reason,"objective_checkpoint_reconciliation_required");
 assert.equal(x.rounds.snapshot(x.matchId).phase,"cancelled");
 assert.equal(x.persistence.latest(x.matchId).terminal,false);
 assert.equal(x.monitor.diagnostics().pendingCleanup,1);
 assert.equal(x.session.heartbeat().error,"dedicated_lease_closed");
 assert.equal(x.session.advanceClock().error,"dedicated_lease_closed");
 const second=x.monitor.sweepExpired();
 assert.equal(second.outcomes[0].reason,"terminal_reconciled");
 assert.equal(second.outcomes[0].closed,true);
 assert.equal(x.persistence.latest(x.matchId).terminal,true);
 assert.equal(x.monitor.diagnostics().pendingCleanup,0);
 assert.equal(x.monitor.diagnostics().completedCleanup,1);
 assert.equal(x.monitor.sweepExpired().outcomes.length,0);
});
test("revoked principal keeps cancellation pending but retry can finish after reauthorization",()=>{
 const x=fixture();
 x.expire();
 x.revoke();
 const first=x.monitor.sweepExpired();
 assert.equal(first.outcomes[0].closed,false);
 assert.equal(first.outcomes[0].reason,"dedicated_server_identity_revoked");
 assert.equal(x.persistence.latest(x.matchId).terminal,false);
 x.restore();
 const second=x.monitor.sweepExpired();
 assert.equal(second.outcomes[0].closed,true);
 assert.equal(x.rounds.snapshot(x.matchId).phase,"cancelled");
 assert.equal(x.session.heartbeat().error,"dedicated_lease_closed");
});
test("reassigned server is never cancelled by previously expired lease",()=>{
 const x=fixture();
 x.expire();
 x.persistence.save({matchId:x.matchId,sectionId:"multiplayer",
   modeId:"objective",mapId:"arena45",serverId:"other-server",
   runtimePhase:"active"});
 const outcome=x.monitor.sweepExpired().outcomes[0];
 assert.equal(outcome.closed,false);
 assert.equal(outcome.reason,"server_reassigned");
 assert.equal(x.rounds.snapshot(x.matchId).phase,"active");
 assert.equal(x.monitor.diagnostics().pendingCleanup,1);
});
test("a normal expired lease cancels exactly once with no subsequent retries",()=>{
 const x=fixture();x.expire();
 const completed=x.monitor.sweepExpired();
 assert.equal(completed.outcomes[0].reason,"cancelled");
 assert.equal(x.persistence.latest(x.matchId).terminal,true);
 assert.equal(x.monitor.sweepExpired().outcomes.length,0);
 assert.equal(x.monitor.diagnostics().completedCleanup,1);
});
