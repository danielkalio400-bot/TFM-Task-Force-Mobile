import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { ObjectiveLiveGateway } from "../src/services/objective-live-gateway.mjs";
import { ObjectiveReconnectBridge } from "../src/services/objective-reconnect-bridge.mjs";
import { ServerObjectiveRoundsService } from "../src/services/server-objective-rounds.mjs";
import { SessionPersistenceService } from "../src/services/session-persistence.mjs";
import { handleObjectiveLiveStream } from "../src/routes/objective-live-stream.mjs";
import { objectiveLiveContract } from "../src/objective-live-contracts.mjs";
import { makeServer } from "../src/server.mjs";

function scenario() {
 let now=100000;
 const rounds=new ServerObjectiveRoundsService({trustedServerIds:["server-a"],clock:()=>now});
 const adapter=rounds.createServerAdapter("server-a").adapter;
 adapter.open({matchId:"original-match",mapId:"original-arena",
   objectiveIds:["north"],players:[
     {playerId:"alpha-player",teamId:"alpha"},
     {playerId:"bravo-player",teamId:"bravo"}
   ],maxPoints:20,durationMs:30000});
 const persistence=new SessionPersistenceService();
 persistence.save({matchId:"original-match",sectionId:"multiplayer",
   modeId:"team-score",mapId:"original-arena",serverId:"server-a",
   runtimePhase:"warmup"});
 const assignment={assignmentId:"assignment-a",matchId:"original-match",
   serverId:"server-a",joinCredential:"local-join-secret",
   expiresAt:"2099-01-01T00:00:00Z"};
 const assignments={validate:(id,cred)=>id===assignment.assignmentId &&
   cred===assignment.joinCredential?{ok:true,assignment}:
     {ok:false,error:"invalid_join_credential"}};
 const bridge=new ObjectiveReconnectBridge({rounds,assignments,persistence,
   authorizeSubject:(principal,id)=>principal?.verified===true &&
     principal.subject===id,clock:()=>now});
 const gateway=new ObjectiveLiveGateway({bridge,rounds,clock:()=>now});
 const join={
   assignmentId:"assignment-a",joinCredential:"local-join-secret",
   matchId:"original-match",playerId:"alpha-player",
   principal:{subject:"alpha-player",verified:true}
 };
 return {rounds,adapter,gateway,join,advance:ms=>{now+=ms;}};
}
test("viewer issue requires matching authenticated subject and assignment",()=>{
 const x=scenario();
 assert.equal(x.gateway.issueViewer({...x.join,principal:null}).error,
   "objective_player_not_authorized");
 assert.equal(x.gateway.issueViewer({...x.join,joinCredential:"bad"}).error,
   "invalid_join_credential");
 const viewer=x.gateway.issueViewer(x.join);
 assert.equal(viewer.ok,true);
 assert.ok(viewer.viewerToken.length>40);
 assert.notEqual(viewer.reconnectToken,viewer.viewerToken);
 assert.equal(x.gateway.attach({token:viewer.viewerToken,matchId:"some-other-match"}).error,
   "live_viewer_match_mismatch");
 const accepted=x.gateway.attach({token:viewer.viewerToken,matchId:"original-match"});
 assert.equal(accepted.ok,true);
 assert.equal(x.gateway.attach({token:viewer.viewerToken,matchId:"original-match"}).error,
   "live_viewer_already_attached");
 accepted.handle.release();
});
test("source event updates synchronize, expiry and resync remain fail-closed",()=>{
 const x=scenario();
 const ticket=x.gateway.issueViewer(x.join);
 const opened=x.gateway.attach({token:ticket.viewerToken,matchId:"original-match"});
 assert.equal(opened.initial.snapshot.phase,"warmup");
 x.adapter.begin("original-match","begin");
 x.adapter.capture("original-match",{requestId:"capture-1",playerId:"alpha-player",
   objectiveId:"north",points:10});
 const update=opened.handle.read(opened.initial.nextSequence);
 assert.equal(update.ok,true);
 assert.equal(update.frame.events.length,2);
 assert.equal(update.frame.events[1].type,"objective-captured");
 x.advance(60000);
 assert.equal(opened.handle.read(update.frame.nextSequence).error,
   "live_viewer_expired");
 opened.handle.release();
});
test("HTTP SSE requires bearer in header, streams current snapshot and changes",async t=>{
 const x=scenario();
 const server=createServer(async(req,res)=>{
   const path=(req.url||"").split("?")[0];
   if(!(await handleObjectiveLiveStream(req,res,path,{
     gateway:x.gateway,contract:objectiveLiveContract,pollIntervalMs:20
   }))) {res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 t.after(async()=>{server.closeAllConnections?.();await new Promise(r=>server.close(r));});
 const base="http://127.0.0.1:"+server.address().port;
 const missing=await fetch(base+"/v1/dev/objective-live/original-match/events");
 assert.equal(missing.status,401);
 const publicToken=await fetch(base+"/v1/dev/objective-live/original-match/events?token=fake",{
   headers:{Authorization:"Bearer "+"t".repeat(43)}
 });
 assert.equal(publicToken.status,400);
 const viewer=x.gateway.issueViewer(x.join);
 const abort=new AbortController();
 const response=await fetch(base+"/v1/dev/objective-live/original-match/events",{
   headers:{Authorization:"Bearer "+viewer.viewerToken,Accept:"text/event-stream"},
   signal:abort.signal
 });
 assert.equal(response.status,200);
 assert.match(response.headers.get("content-type"),/text\/event-stream/);
 assert.match(response.headers.get("cache-control"),/no-store/);
 const reader=response.body.getReader();
 const first=await reader.read();
 assert.match(new TextDecoder().decode(first.value),/event: snapshot/);
 x.adapter.begin("original-match","begin");
 const next=await Promise.race([
   reader.read(),
   new Promise((_,reject)=>setTimeout(()=>reject(new Error("sse_timeout")),2500))
 ]);
 assert.match(new TextDecoder().decode(next.value),/event: delta/);
 abort.abort();
 await reader.cancel().catch(()=>{});
});
test("production makeServer exposes contract, not public viewer issuance",async t=>{
 const server=makeServer();
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 t.after(()=>server.close());
 const base="http://127.0.0.1:"+server.address().port;
 const c=await fetch(base+"/v1/runtime/objective-live-stream");
 assert.equal((await c.json()).bulk,35);
 const noAccess=await fetch(base+"/v1/dev/objective-live/fake/events");
 assert.equal(noAccess.status,401);
 const mutate=await fetch(base+"/v1/dev/objective-live/fake/events",{method:"POST"});
 assert.equal(mutate.status,405);
});
