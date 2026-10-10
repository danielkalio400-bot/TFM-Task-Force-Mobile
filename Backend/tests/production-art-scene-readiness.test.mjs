import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const editor = readFileSync(new URL("../../GameClient/StarterAssets/Assets/_TFM/Editor/TFMProductionArtInstaller.cs", import.meta.url), "utf8");

test("TFM validates actual imported scene instances and enabled art", () => {
  assert.match(editor, /private static void VerifyInstalled\(/);
  assert.match(editor, /PrefabUtility\.GetCorrespondingObjectFromSource/);
  assert.match(editor, /source != expected/);
  assert.match(editor, /activeInHierarchy/);
  assert.match(editor, /renderer\.enabled/);
  assert.match(editor, /collider\.enabled/);
  assert.match(editor, /!collider\.isTrigger/);
  assert.match(editor, /animator\.runtimeAnimatorController != null/);
  assert.match(editor, /animator\.avatar\.isHuman/);
  assert.match(editor, /TFM Production Operator/);
  assert.match(editor, /TFM Production Environment/);
  assert.match(editor, /TFM Production Practice Target/);
  assert.doesNotMatch(editor, /SaveScene\(/);
});
