import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../../GameClient/StarterAssets/Assets/_TFM/Online/Objectives/TFMObjectiveLiveStreamClient.cs",import.meta.url),"utf8");
test("SSE download callback queues frames and Unity-only APIs run on main thread",()=>{
 assert.match(src,/DownloadHandlerScript/);
 assert.match(src,/new EventDownload\(QueueFrame\)/);
 assert.match(src,/private void QueueFrame/);
 assert.match(src,/lock \(_frameLock\)/);
 assert.match(src,/private void Update\(\) \{ FlushFrames\(\); \}/);
 assert.match(src,/MaxQueuedFrames = 256/);
 assert.match(src,/Status = "stream-overflow"/);
 const flush=src.indexOf("private void FlushFrames()");
 const handle=src.indexOf("private void HandleFrame(");
 assert.ok(handle>flush);
 assert.doesNotMatch(src.slice(src.indexOf("private void QueueFrame"),flush),/JsonUtility/);
});
