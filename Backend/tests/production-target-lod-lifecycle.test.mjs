import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root = new URL("../../GameClient/StarterAssets/Assets/_TFM/", import.meta.url);
const code = name => readFileSync(new URL(name, root), "utf8");

test("full production targets are activated atomically for authored LOD and rig hierarchy", () => {
  const target=code("Gameplay/Combat/TFMTargetDummy.cs");
  assert.match(target,/transform\.Find\("TFM Production Practice Target"\)/);
  assert.match(target,/_productionVisual = installed != null \? installed\.gameObject : null/);
  assert.match(target,/if \(_productionVisual != null\)/);
  assert.match(target,/_productionVisual\.SetActive\(visible\)/);
  assert.match(target,/if \(_productionVisual\.activeSelf != visible\)/);
  assert.match(target,/return;\s*}\s*foreach \(Renderer targetRenderer in _renderers\)/);
  assert.match(target,/yield return new WaitForSeconds\(respawnDelay\)/);
  assert.match(target,/ResetTarget\(\)/);
  assert.doesNotMatch(target,/gameObject\.SetActive\(visible\)/);
});

test("legacy targets retain independent collider and renderer toggles without resurrecting imported blockouts",()=>{
  const target=code("Gameplay/Combat/TFMTargetDummy.cs");
  const installer=code("Editor/TFMProductionArtInstaller.cs");
  assert.match(target,/targetRenderer\.enabled = visible/);
  assert.match(target,/targetCollider\.enabled = visible/);
  assert.match(target,/renderer\.enabled &&/);
  assert.match(target,/collider\.enabled &&/);
  assert.match(target,/if \(_usesImportedTarget\) return/);
  assert.match(installer,/HideLegacy\(target\.transform\.Find\("Body"\)\)/);
  assert.match(installer,/HideLegacy\(target\.transform\.Find\("Head"\)\)/);
});
