import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const editor=read("Editor/TFMOperatorVisualWorkbench.cs");
const aura=read("Presentation/TFMOperatorEnergyAura.cs");
const manifest=read("TFM-Source-Manifest.txt");

test("TFM operator preview is installed in the existing authored training scene",()=>{
 for(const rel of ["Editor/TFMOperatorVisualWorkbench.cs","Presentation/TFMOperatorEnergyAura.cs"])
   assert.equal(manifest.split(/\r?\n/).filter(x=>x===rel).length,1,rel);
 assert.match(editor,/TFM\/Operator\/Install FBX and Energy Preview/);
 assert.match(editor,/TFMTrainingSceneBuilder\.ScenePath/);
 assert.match(editor,/GetComponentsInChildren<TFMThirdPersonMotor>\(true\)/);
 assert.match(editor,/player\.transform\.Find\("TFM Production Operator"\)/);
 assert.match(editor,/PrefabUtility\.InstantiatePrefab\(imported, scene\)/);
 assert.match(editor,/Undo\.RegisterCreatedObjectUndo/);
 assert.match(editor,/EditorSceneManager\.MarkSceneDirty\(scene\)/);
 assert.doesNotMatch(editor,/EditorSceneManager\.SaveScene\(/);
 assert.match(editor,/bridge\.Configure\(player\.transform\)/);
 assert.match(editor,/oldRenderer\.enabled = false/);
 assert.match(editor,/LayerMask\.NameToLayer\("Ignore Raycast"\)/);
});
test("authored texture materials and FBX models are never mutated for cosmetic preview",()=>{
 assert.match(editor,/TFM\/Operator\/Apply Tactical Material Preview/);
 assert.match(editor,/if \(current == tactical \|\| current == visor \|\| HasAuthoredTexture\(current\)\)/);
 assert.match(editor,/Undo\.RecordObject\(renderer/);
 assert.match(editor,/renderer\.sharedMaterials = slots/);
 assert.match(editor,/TFM\/Operator\/Inspect Imported FBX/);
 assert.match(editor,/Mesh vertices:/);
 assert.match(editor,/Texture-bearing material slots:/);
 assert.match(editor,/Imported animation clips:/);
 assert.doesNotMatch(editor,/AssetDatabase\.DeleteAsset/);
 assert.doesNotMatch(editor,/ModelImporter.*SaveAndReimport/);
});
test("procedural original cosmetic ring uses URP PBR emission without modifying gameplay",()=>{
 assert.match(editor,/Shader\.Find\("Universal Render Pipeline\/Lit"\)/);
 assert.match(editor,/CreateRingMesh\(\)/);
 assert.match(editor,/segments = 64/);
 assert.match(editor,/tubeSides = 6/);
 assert.match(editor,/MaterialGlobalIlluminationFlags\.None/);
 assert.match(editor,/TFMOperatorEnergyAura/);
 assert.match(aura,/Application\.isMobilePlatform/);
 assert.match(aura,/SystemInfo\.graphicsMemorySize < 2500/);
 assert.match(aura,/QualitySettings\.GetQualityLevel\(\) <= 1/);
 assert.match(aura,/upperRing\.gameObject\.SetActive\(false\)/);
 assert.match(aura,/GetPropertyBlock\(_block\)/);
 assert.match(aura,/SetPropertyBlock\(_block\)/);
 assert.doesNotMatch(aura,/AddComponent<Collider>/);
});
