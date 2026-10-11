import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../GameClient/StarterAssets/Assets/_TFM/Player/Camera/TFMThirdPersonCamera.cs", import.meta.url), "utf8");

test("TFM namespace Camera never shadows the UnityEngine Camera component", () => {
  assert.match(source, /namespace TFM\.Player\.Camera/);
  assert.match(source, /private UnityEngine\.Camera _camera;/);
  assert.match(source, /GetComponent<UnityEngine\.Camera>\(\)/);
  assert.doesNotMatch(source, /\bprivate Camera _camera;/);
  assert.doesNotMatch(source, /GetComponent<Camera>\(\)/);
});
