import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const base = new URL("../../GameClient/StarterAssets/Assets/_TFM/", import.meta.url);
const load = name => readFileSync(new URL(name,base),"utf8");

test("respawning an imported range target cannot resurrect disabled primitive meshes",()=>{
  const target=load("Gameplay/Combat/TFMTargetDummy.cs");
  const installer=load("Editor/TFMProductionArtInstaller.cs");
  assert.match(target,/GetComponentsInChildren<Renderer>\(true\)/);
  assert.match(target,/GetComponentsInChildren<Collider>\(true\)/);
  assert.match(target,/renderer\.enabled &&/);
  assert.match(target,/collider\.enabled &&/);
  assert.match(target,/renderer\.gameObject\.activeInHierarchy/);
  assert.match(target,/!collider\.isTrigger/);
  assert.match(target,/private void SetTargetVisible\(bool visible\)/);
  assert.match(target,/targetRenderer\.enabled = visible/);
  assert.match(target,/targetCollider\.enabled = visible/);
  assert.match(installer,/HideLegacy\(target\.transform\.Find\("Body"\)\)/);
  assert.match(installer,/HideLegacy\(target\.transform\.Find\("Head"\)\)/);
});

test("realistic practice targets keep their PBR materials without synthesized tint",()=>{
  const target=load("Gameplay/Combat/TFMTargetDummy.cs");
  assert.match(target,/transform\.Find\("TFM Production Practice Target"\)/);
  assert.match(target,/if \(_usesImportedTarget\) return/);
  assert.match(target,/ApplyColor\(hitColor\)/);
  assert.match(target,/ApplyColor\(targetColor\)/);
  assert.match(target,/StopAllCoroutines\(\)/);
  const weapon=load("Gameplay/Combat/TFMHitscanWeapon.cs");
  assert.match(weapon,/_hitMarkerUntil = Time\.time \+ 0\.12f/);
});
