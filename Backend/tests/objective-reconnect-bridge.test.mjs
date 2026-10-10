import test from "node:test";
import assert from "node:assert/strict";
import { ServerObjectiveRoundsService } from "../src/services/server-objective-rounds.mjs";
import { ObjectiveReconnectBridge } from "../src/services/objective-reconnect-bridge.mjs";
import { SessionPersistenceService } from "../src/services/session-persistence.mjs";

function setup({eventLimit=32,lifetimeMs=90000}={}) {
 let clock=10000;
 const rounds=new ServerObjectiveRoundsService({trustedServerIds:["server-a"],
   clock:()=>clock,eventLimit});
 const assignment={assignmentId:"assigned-1",matchId:"match-1",
   serverId:"server-a",joinCredential:"secret-test",expiresAt:"2099-01-01T00:00:00Z"};
 const assignments={validate:(id,credential)=>id===assignment.assignmentId &&
   credential===assignment.joinCredential
   ?{ok:true,assignment}:{ok:false,error:"invalid_join_credential"}};
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"match-1",sectionId:"multiplayer",modeId:"team-score",
   mapId:"original",serverId:"server-a",region:"test",runtimePhase:"connecting"});
 const adapter=rounds.createServerAdapter("server-a").adapter;
 adapter.open({matchId:"match-1",mapId:"original",objectiveIds:["checkpoint"],
   players:[{playerId:"p1",teamId:"alpha"},{playerId:"p2",teamId:"bravo"}],
   durationMs:30000,maxPoints:100});
 const bridge=new ObjectiveReconnectBridge({
   rounds,assignments,persistence,
   authorizeSubject:(principal,playerId)=>principal?.subject===playerId,
   clock:()=>clock,lifetimeMs
 });
 return {bridge,adapter,rounds,persistence,advance:n=>{clock+=n;},
   initial:{assignmentId:"assigned-1",joinCredential:"secret-test",matchId:"match-1",
     playerId:"p1",principal:{subject:"p1"}}};
}
test("fail closed without actual subject authorization, valid assignment and roster",()=>{
 const x=setup();
 assert.equal(x.bridge.connect({...x.initial,principal:null}).error,"objective_player_not_authorized");
 assert.equal(x.bridge.connect({...x.initial,joinCredential:"wrong"}).error,"invalid_join_credential");
 assert.equal(x.bridge.connect({...x.initial,playerId:"p3",principal:{subject:"p3"}}).error,
   "objective_player_not_enrolled");
 const r=x.bridge.connect(x.initial);
 assert.equal(r.ok,true);
 assert.equal(r.snapshot.grantsProgression,false);
 assert.equal(r.snapshot.phase,"warmup");
 assert.equal(r.events.length,1);
 assert.equal(r.reconnectToken.length>32,true);
});
test("single-use reconnect token prevents replay and impersonation",()=>{
 const x=setup();
 const r=x.bridge.connect(x.initial);
 assert.equal(x.bridge.reconnect({reconnectToken:r.reconnectToken,playerId:"p2",
   principal:{subject:"p2"}}).error,"reconnect_player_mismatch");
 assert.equal(x.bridge.reconnect({reconnectToken:r.reconnectToken,playerId:"p1",
   principal:{subject:"p2"}}).error,"objective_player_not_authorized");
 const recovered=x.bridge.reconnect({reconnectToken:r.reconnectToken,playerId:"p1",
   principal:{subject:"p1"},lastRevision:1});
 assert.equal(recovered.ok,true);
 assert.equal(recovered.events.length,0);
 assert.equal(x.bridge.reconnect({reconnectToken:r.reconnectToken,playerId:"p1",
   principal:{subject:"p1"}}).error,"reconnect_ticket_consumed");
});
test("truncated event retention requires full snapshot resynchronization",()=>{
 const x=setup({eventLimit:2});
 x.adapter.begin("match-1","start");
 x.adapter.capture("match-1",{requestId:"cap-1",playerId:"p1",objectiveId:"checkpoint"});
 const r=x.bridge.connect({...x.initial,lastRevision:0});
 assert.equal(r.ok,true);
 assert.equal(r.resyncRequired,true);
 assert.equal(r.events.length,0);
 assert.equal(r.nextSequence,x.rounds.snapshot("match-1").revision);
 const tooFar=x.bridge.connect({...x.initial,lastRevision:99999});
 assert.equal(tooFar.error,"objective_cursor_ahead");
});
test("active and terminal phases update existing session persistence without new authority",()=>{
 const x=setup();
 assert.equal(x.bridge.syncSession({...x.initial}).ok,true);
 assert.equal(x.bridge.syncSession({...x.initial}).replay,true);
 x.adapter.begin("match-1","start");
 const active=x.bridge.syncSession(x.initial);
 assert.equal(active.snapshot.runtimePhase,"active");
 assert.equal(active.snapshot.terminal,false);
 const reconnect=x.bridge.connect(x.initial);
 assert.equal(reconnect.ok,true);
 x.adapter.close("match-1","cancel");
 const end=x.bridge.syncSession(x.initial);
 assert.equal(end.snapshot.terminal,true);
 assert.equal(x.bridge.reconnect({reconnectToken:reconnect.reconnectToken,playerId:"p1",
   principal:{subject:"p1"}}).error,"objective_round_not_restorable");
 assert.equal(x.bridge.connect(x.initial).error,"active_session_snapshot_required");
});
test("expired reconnect capability does not consume or reveal another player",()=>{
 const x=setup({lifetimeMs:1000});
 const ticket=x.bridge.connect(x.initial);
 x.advance(1000);
 assert.equal(x.bridge.reconnect({reconnectToken:ticket.reconnectToken,
   playerId:"p1",principal:{subject:"p1"}}).error,"reconnect_ticket_expired");
});
test("integration source never opens a public join or score mutation endpoint",async()=>{
 const {readFileSync}=await import("node:fs");
 const route=readFileSync(new URL("../src/routes/server-objective-rounds.mjs",import.meta.url),"utf8");
 assert.match(route,/server_authority_required/);
 assert.doesNotMatch(route,/connect\(/);
 const bridge=readFileSync(new URL("../src/services/objective-reconnect-bridge.mjs",import.meta.url),"utf8");
 assert.match(bridge,/authorizeSubject/);
 assert.match(bridge,/createHash\("sha256"\)/);
});
