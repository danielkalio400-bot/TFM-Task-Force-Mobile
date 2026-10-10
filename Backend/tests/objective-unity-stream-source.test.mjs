import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const file=path=>readFileSync(new URL(path,root),"utf8");
test("Unity client has real streaming implementation and runtime-only auth header",()=>{
 const src=file("Online/Objectives/TFMObjectiveLiveStreamClient.cs");
 assert.match(src,/UnityWebRequest/);
 assert.match(src,/DownloadHandlerScript/);
 assert.match(src,/Authorization", "Bearer "/);
 assert.match(src,/Uri\.EscapeDataString\(_matchId\)/);
 assert.match(src,/SnapshotUpdated\?\.Invoke/);
 assert.match(src,/Uri\.UriSchemeHttps/);
 assert.doesNotMatch(src,/PlayerPrefs|\.SetRequestHeader\("Authorization", "Basic/);
});
test("SSE parser handles chunked UTF8 decode state and refuses buffer overflow",()=>{
 const src=file("Online/Objectives/TFMObjectiveLiveStreamClient.cs");
 assert.match(src,/GetDecoder\(\)/);
 assert.match(src,/ReceiveData\(byte\[\] data, int dataLength\)/);
 assert.match(src,/Status = "resync-required"/);
 const parser=file("Online/Objectives/TFMObjectiveSseFrameParser.cs");
 assert.match(parser,/MaxBufferedChars/);
});
