import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const code=path=>readFileSync(new URL(path,root),"utf8");

test("client reconnect cursor distinguishes event sequence from snapshot revision",()=>{
 const source=code("Online/Objectives/TFMObjectiveEventCursor.cs");
 assert.match(source,/view\.snapshot\.revision < current\.revision/);
 assert.match(source,/view\.snapshot\.revision > current\.revision/);
 assert.match(source,/entry\.sequence != next \+ 1/);
 assert.match(source,/view\.nextSequence != next/);
 assert.match(source,/LastEventSequence = next/);
 assert.match(source,/RequiresFullResync = true/);
 assert.match(source,/view\.resyncRequired/);
});
test("objective reconnect code is not a client-authoritative score writer",()=>{
 const s=code("Online/Objectives/TFMObjectiveEventCursor.cs");
 assert.doesNotMatch(s,/ScoreChanged|PlayerPrefs|SetInt\(|AwardXp|PostScore/);
 const bridge=readFileSync(new URL("../src/services/objective-reconnect-bridge.mjs",import.meta.url),"utf8");
 assert.match(bridge,/authorizeSubject=\(\)=>false/);
 assert.match(bridge,/ticket\.consumed=true/);
 assert.match(bridge,/page\.oldestSequence>lastRevision\+1/);
});
