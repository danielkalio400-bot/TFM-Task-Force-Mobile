import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root = new URL("../../GameClient/StarterAssets/Assets/_TFM/", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");

test("TFM production art requires imported physical prefabs and does not fabricate models", () => {
  const profile = read("Presentation/TFMProductionArtProfile.cs");
  const editor = read("Editor/TFMProductionArtInstaller.cs");
  const manifest = read("TFM-Source-Manifest.txt");
  assert.match(profile, /CreateAssetMenu/);
  for (const field of ["OperatorPrefab", "EnvironmentPrefab", "PracticeTargetPrefab"])
    assert.match(profile, new RegExp(field));
  assert.match(editor, /PrefabUtility\.IsPartOfPrefabAsset/);
  assert.match(editor, /GetComponentsInChildren<Collider>\(true\)/);
  assert.match(editor, /PrefabUtility\.InstantiatePrefab/);
  assert.match(editor, /Undo\.RegisterCreatedObjectUndo/);
  assert.match(editor, /EditorSceneManager\.MarkSceneDirty/);
  assert.doesNotMatch(editor, /SaveScene\(/);
  assert.match(editor, /players\.Length != 1 \|\| targets\.Length != 3/);
  assert.match(editor, /target\.transform\.Find\("Body"\)/);
  assert.match(editor, /target\.transform\.Find\("Head"\)/);
  for (const path of ["Presentation/TFMProductionArtProfile.cs", "Editor/TFMProductionArtInstaller.cs"])
    assert.equal(manifest.split(/\r?\n/).filter(s => s === path).length, 1);
});
