import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root = new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const source = path => readFileSync(new URL(path,root),"utf8");

test("training moving targets are runtime-only and preserve authored motion",()=>{
 const bootstrap=source("Gameplay/Prototype/TFMPrototypeBootstrap.cs");
 const motion=source("Gameplay/Combat/TFMTargetMotion.cs");
 const manifest=source("TFM-Source-Manifest.txt");
 assert.match(bootstrap,/GetComponentsInChildren<TFMTargetDummy>\(true\)/);
 assert.match(bootstrap,/if \(motion != null\) continue/);
 assert.match(bootstrap,/AddComponent<TFMTargetMotion>\(\)/);
 assert.match(motion,/TFMTrainingTrialPhase\.Running/);
 assert.match(motion,/transform\.localPosition = _origin/);
 assert.match(motion,/Mathf\.Clamp\(amplitude/);
 assert.match(motion,/Mathf\.Clamp\(frequency/);
 assert.equal(manifest.split(/\r?\n/).filter(x=>x==="Gameplay/Combat/TFMTargetMotion.cs").length,1);
});
