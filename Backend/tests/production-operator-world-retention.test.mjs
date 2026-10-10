import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = new URL("../../GameClient/StarterAssets/Assets/_TFM/", import.meta.url);
const load = path => readFileSync(new URL(path,base), "utf8");

test("production replacement disables only original blockout mesh and collider", () => {
  const editor=load("Editor/TFMProductionArtInstaller.cs");
  assert.match(editor,/OriginalArenaBlocks/);
  assert.match(editor,/OriginalArenaBlocks\.Contains\(child\.name\)/);
  assert.match(editor,/legacy\.GetComponent<Renderer>\(\)/);
  assert.match(editor,/legacy\.GetComponent<Collider>\(\)/);
  assert.match(editor,/renderer\.enabled = false/);
  assert.match(editor,/collider\.enabled = false/);
  assert.doesNotMatch(editor,/legacy\.gameObject\.SetActive\(false\)/);
  assert.match(editor,/LegacyRendererVisible/);
  assert.match(editor,/Undo\.RecordObject/);
  assert.doesNotMatch(editor,/SaveScene\(/);
});

test("imported operator cannot intercept camera and aiming rays", () => {
  const editor=load("Editor/TFMProductionArtInstaller.cs");
  const camera=load("Player/Camera/TFMThirdPersonCamera.cs");
  const weapon=load("Gameplay/Combat/TFMHitscanWeapon.cs");
  assert.match(editor,/SetOperatorRaycastLayer\(avatar\)/);
  assert.match(editor,/LayerMask\.NameToLayer\("Ignore Raycast"\)/);
  assert.match(editor,/GetComponentsInChildren<Transform>\(true\)/);
  assert.match(editor,/operatorVisual\.GetComponentsInChildren/);
  assert.match(camera,/collisionMask = ~\(1 << 2\)/);
  assert.match(weapon,/hitMask = ~\(1 << 2\)/);
});

test("authored operator clips are visual only with motor-authoritative movement", () => {
  const bridge=load("Presentation/TFMOperatorMotionBridge.cs");
  assert.match(bridge,/animator\.applyRootMotion = false/);
  assert.match(bridge,/animator\.SetFloat\(SpeedId, speed\)/);
  assert.match(bridge,/animator\.SetBool\(GroundedId, grounded\)/);
});
