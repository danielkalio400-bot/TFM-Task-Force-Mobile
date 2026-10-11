import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const editor=read("Editor/TFMOperatorAnimationPipeline.cs");
const bridge=read("Presentation/TFMOperatorMotionBridge.cs");
const manifest=read("TFM-Source-Manifest.txt");

test("operator animation pipeline is shipped exactly once by source sync",()=>{
 assert.equal(manifest.split(/\r?\n/).filter(x=>x==="Editor/TFMOperatorAnimationPipeline.cs").length,1);
 assert.equal(manifest.split(/\r?\n/).filter(x=>x==="Presentation/TFMOperatorMotionBridge.cs").length,1);
 assert.match(editor,/MenuItem\("TFM\/Operator\/Animations\/1 - Prepare Animation Folders"\)/);
 assert.match(editor,/Configure Imported Humanoid Clips/);
 assert.match(editor,/Audit Animation Clips/);
 assert.match(editor,/Build and Bind Locomotion/);
 assert.match(editor,/Assets\/_TFM\/ProductionArt\/Animations/);
 assert.match(editor,/AuditBatch\(\)/);
});

test("import remains humanoid, artist sourced, non destructive",()=>{
 assert.match(editor,/ModelImporterAnimationType\.Human/);
 assert.match(editor,/ModelImporterAvatarSetup\.CreateFromThisModel/);
 assert.match(editor,/importer\.importAnimation = true/);
 assert.match(editor,/importer\.clipAnimations = configurations/);
 assert.match(editor,/clip\.humanMotion/);
 assert.match(editor,/Multiple .* animation clips found/);
 assert.match(editor,/Expected exactly one Animator with a valid Humanoid Avatar/);
 assert.doesNotMatch(editor,/AssetDatabase\.DeleteAsset\(/);
 assert.doesNotMatch(editor,/SaveScene\(/);
 assert.doesNotMatch(editor,/character\.fbx.*SaveAndReimport/);
 assert.match(editor,/PrefabUtility\.RecordPrefabInstancePropertyModifications\(animator\)/);
 assert.match(editor,/Undo\.RecordObject\(animator/);
 assert.match(editor,/EditorSceneManager\.MarkSceneDirty\(scene\)/);
});

test("locomotion uses real humanoid clips with normalized speed and inert actor roots",()=>{
 assert.match(editor,/clips\.Idle == null \|\| clips\.Walk == null \|\| clips\.Run == null/);
 assert.match(editor,/AnimatorController\.CreateAnimatorControllerAtPath/);
 assert.match(editor,/BlendTreeType\.Simple1D/);
 assert.match(editor,/blendParameter = "Speed"/);
 assert.match(editor,/blend\.AddChild\(clips\.Idle, 0f\)/);
 assert.match(editor,/blend\.AddChild\(clips\.Walk, 0\.67f\)/);
 assert.match(editor,/blend\.AddChild\(clips\.Run, 1f\)/);
 assert.match(editor,/animator\.applyRootMotion = false/);
 assert.match(bridge,/runSpeedMetersPerSecond = 7\.5f/);
 assert.match(bridge,/animator\.SetFloat\(SpeedId, speed\)/);
 assert.match(bridge,/animator\.applyRootMotion = false/);
});

test("optional practice actions don't affect combat authority",()=>{
 assert.match(editor,/AddActionState\(machine, locomotion, "Fire", clips\.Fire, "IsFiring"\)/);
 assert.match(editor,/AddActionState\(machine, locomotion, "Reload", clips\.Reload, "IsReloading"\)/);
 assert.match(bridge,/TFMHitscanWeapon/);
 assert.match(bridge,/_practiceWeapon\.IsReloading/);
 assert.match(bridge,/_input\.FireHeld/);
 assert.match(bridge,/animator\.SetBool\(FiringId, firing\)/);
 assert.match(bridge,/animator\.SetBool\(ReloadingId, reloading\)/);
 assert.doesNotMatch(bridge,/TakeDamage|StartReload\(|Physics\.Raycast/);
});
