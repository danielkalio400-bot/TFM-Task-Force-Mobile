import test from "node:test";
import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {readFileSync} from "node:fs";
import {resolveObjectiveStreamCursor,handleObjectiveLiveStream}
 from "../src/routes/objective-live-stream.mjs";
const u=(qs="")=>new URL("http://localhost/stream"+qs);
test("resume cursor follows Last-Event-ID, rejects malformed or contradictory input",()=>{
 assert.deepEqual(resolveObjectiveStreamCursor(u(),undefined),{ok:true,afterSequence:0});
 assert.deepEqual(resolveObjectiveStreamCursor(u(),"124"),{ok:true,afterSequence:124});
 assert.equal(resolveObjectiveStreamCursor(u("?afterSequence=12"),undefined).afterSequence,12);
 assert.equal(resolveObjectiveStreamCursor(u("?afterSequence=12"),"12").ok,true);
 assert.equal(resolveObjectiveStreamCursor(u("?afterSequence=12"),"11").error,
   "conflicting_objective_cursors");
 for(const bad of ["-1","1.5","1e3","+1","01","9007199254740992","NaN","Infinity"])
   assert.equal(resolveObjectiveStreamCursor(u(),bad).ok,false,bad);
 assert.equal(resolveObjectiveStreamCursor(u("?afterSequence=1&afterSequence=2")).error,
   "duplicate_objective_cursor");
});
function fakeStream({writeOk=true,afterHeader}={}) {
 const req=new EventEmitter();
 req.method="GET";
 req.url="/v1/dev/objective-live/m40/events";
 req.headers={authorization:"Bearer "+("a".repeat(43))};
 if(afterHeader!==undefined)req.headers["last-event-id"]=afterHeader;
 const res=new EventEmitter();
 res.destroyed=false;res.status=null;res.frames=[];
 res.writeHead=function(status,headers){this.status=status;this.headers=headers};
 res.write=function(frame){this.frames.push(frame);return writeOk};
 res.destroy=function(){this.destroyed=true;this.emit("close")};
 res.end=function(){this.ended=true;this.emit("close")};
 return {req,res};
}
const gatewayFixture=()=> {
 let releases=0,attaches=0,afterSequence=null;
 return {
  gateway:{attach:({afterSequence:a})=>{
    attaches++;afterSequence=a;
    return {ok:true,expiresAtMs:Date.now()+60000,
      handle:{read:()=>({ok:false,error:"ended"}),release:()=>{releases++}},
      initial:{snapshot:{revision:4,phase:"active"},events:[],
        nextSequence:4,resyncRequired:false,hasMore:false,terminal:false}};
  }},
  observe:()=>({releases,attaches,afterSequence})
 };
};
test("SSE stream resumes from HTTP Last-Event-ID and ignores incoming request close",async()=>{
 const fixture=gatewayFixture();
 const {req,res}=fakeStream({afterHeader:"3"});
 assert.equal(await handleObjectiveLiveStream(req,res,
   "/v1/dev/objective-live/m40/events",
   {gateway:fixture.gateway,contract:{},pollIntervalMs:50}),true);
 assert.equal(res.status,200);
 assert.equal(fixture.observe().afterSequence,3);
 req.emit("close");
 assert.equal(fixture.observe().releases,0);
 res.emit("close");
 assert.equal(fixture.observe().releases,1);
});
test("backpressure ends stream without unbounded writes and releases viewer exactly once",async()=>{
 const fixture=gatewayFixture();
 const {req,res}=fakeStream({writeOk:false});
 assert.equal(await handleObjectiveLiveStream(req,res,
   "/v1/dev/objective-live/m40/events",
   {gateway:fixture.gateway,contract:{},pollIntervalMs:25}),true);
 assert.equal(res.destroyed,true);
 assert.equal(res.frames.length,1);
 assert.equal(fixture.observe().releases,1);
 res.emit("close");
 assert.equal(fixture.observe().releases,1);
});
test("Unity stream generation invalidates stale download-handler callbacks",()=>{
 const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
 const src=readFileSync(new URL("Online/Objectives/TFMObjectiveLiveStreamClient.cs",root),"utf8");
 assert.match(src,/_streamEpoch\+\+/);
 assert.match(src,/if \(epoch != _streamEpoch\) return/);
 assert.match(src,/frame => QueueFrame\(epoch, frame\)/);
 assert.match(src,/lock \(_frameLock\)/);
 assert.match(src,/private void Update\(\) \{ FlushFrames\(\); \}/);
});
