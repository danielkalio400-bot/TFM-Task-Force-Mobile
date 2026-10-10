import test from "node:test";
import assert from "node:assert/strict";
import {ObjectiveServerLeaseMonitor} from "../src/services/objective-server-lease-monitor.mjs";
import {ObjectiveDedicatedSessionBridge} from "../src/services/objective-dedicated-session-bridge.mjs";
import {SessionPersistenceService} from "../src/services/session-persistence.mjs";
import {ServerObjectiveRoundsService} from "../src/services/server-objective-rounds.mjs";

function harness({failureCount=0}={}){
 let now=100000,allowed=true,outages=failureCount;
 const persisted=new SessionPersistenceService();
 persisted.save({matchId:"unopened46",sectionId:"multiplayer",modeId:"objective",
  mapId:"original-range",region:"west-africa",serverId:"s46",
  runtimePhase:"connecting"});
 const store={
  latest:id=>persisted.latest(id),
  saveIfCurrent:(value,fence)=>{
   if(outages>0){outages--;return {ok:false,error:"temporary_db_outage"};}
   return persisted.saveIfCurrent(value,fence);
  }
 };
 const rounds=new ServerObjectiveRoundsService({
  clock:()=>now,trustedServerIds:["s46"]
 });
 const principal=Object.freeze({id:"allowed-s46"});
 const bridge=new ObjectiveDedicatedSessionBridge({
  rounds,persistence:store,
  authorizeServer:(identity,host)=>allowed && identity===principal && host==="s46"
 });
 const monitor=new ObjectiveServerLeaseMonitor({
  bridge,persistence:store,clock:()=>now,leaseMs:2000
 });
 const registration=monitor.register({
  serverId:"s46",matchId:"unopened46",principal
 });
 assert.equal(registration.ok,true);
 return {monitor,rounds,persisted,session:registration.session,
  expire:()=>{now+=2001;},
  revoke:()=>{allowed=false;},
  authorize:()=>{allowed=true;}
 };
}

test("unused allocated server expires without needing a fictional objective round",()=>{
 const x=harness(),matchId="unopened46";
 assert.equal(x.rounds.snapshot(matchId),null);
 x.expire();
 const result=x.monitor.sweepExpired().outcomes;
 assert.equal(result.length,1);
 assert.equal(result[0].reason,"unused_assignment_cancelled");
 assert.equal(result[0].closed,true);
 const snapshot=x.persisted.latest(matchId);
 assert.equal(snapshot.terminal,true);
 assert.equal(snapshot.runtimePhase,"cancelled");
 assert.equal(snapshot.sequence,2);
 assert.equal(x.rounds.snapshot(matchId),null);
 assert.equal(x.session.heartbeat().error,"dedicated_lease_closed");
 assert.equal(x.monitor.sweepExpired().outcomes.length,0);
});
test("temporary database failure does not lose or duplicate unused assignment cleanup",()=>{
 const x=harness({failureCount:1}); x.expire();
 const first=x.monitor.sweepExpired().outcomes[0];
 assert.equal(first.closed,false);
 assert.equal(first.reason,"temporary_db_outage");
 assert.equal(x.persisted.latest("unopened46").sequence,1);
 assert.equal(x.monitor.diagnostics().pendingCleanup,1);
 const next=x.monitor.sweepExpired().outcomes[0];
 assert.equal(next.reason,"unused_assignment_cancelled");
 assert.equal(x.persisted.latest("unopened46").sequence,2);
 assert.equal(x.monitor.sweepExpired().outcomes.length,0);
});
test("revoked server cannot cancel an unopened match until verifier authorizes it",()=>{
 const x=harness(); x.expire(); x.revoke();
 const first=x.monitor.sweepExpired().outcomes[0];
 assert.equal(first.reason,"dedicated_server_identity_revoked");
 assert.equal(x.persisted.latest("unopened46").terminal,false);
 x.authorize();
 assert.equal(x.monitor.sweepExpired().outcomes[0].reason,
  "unused_assignment_cancelled");
 assert.equal(x.session.heartbeat().error,"dedicated_lease_closed");
});
test("reassignment prevents old expired server from cancelling newer authority",()=>{
 const x=harness();x.expire();
 x.persisted.save({matchId:"unopened46",sectionId:"multiplayer",
   modeId:"objective",mapId:"original-range",region:"west-africa",
   serverId:"other46",runtimePhase:"connecting"});
 const status=x.monitor.sweepExpired().outcomes[0];
 assert.equal(status.reason,"server_reassigned");
 assert.equal(status.closed,false);
 assert.equal(x.persisted.latest("unopened46").serverId,"other46");
 assert.equal(x.persisted.latest("unopened46").terminal,false);
});
