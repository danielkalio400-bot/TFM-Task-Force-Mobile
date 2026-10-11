import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const editor=read("Editor/TFMDistrictWorldBuilder.cs");
const world=read("World/TFMWorldIdentity.cs");
const patrol=read("Gameplay/Combat/TFMDistrictPatrol.cs");
const bootstrap=read("Gameplay/Prototype/TFMPrototypeBootstrap.cs");
const hud=read("UI/HUD/TFMPrototypeHud.cs");
const manifest=read("TFM-Source-Manifest.txt");

test("real authored TFM district scene created separately; original user scene untouched",()=>{
 for(const path of ["Editor/TFMDistrictWorldBuilder.cs","World/TFMWorldIdentity.cs",
                     "Gameplay/Combat/TFMDistrictPatrol.cs"])
   assert.equal(manifest.split(/\r?\n/).filter(x=>x===path).length,1,path);
 assert.match(editor,/MenuItem\("TFM\/Worlds\/Create District 01"\)/);
 assert.match(editor,/MenuItem\("TFM\/Worlds\/Open District 01"\)/);
 assert.match(editor,/Assets\/_TFM\/Scenes\/TFMDistrict01\.unity/);
 assert.match(editor,/SaveCurrentModifiedScenesIfUserWantsTo/);
 assert.match(editor,/SaveScene\(source, DistrictScene, true\)/);
 assert.match(editor,/TFMTrainingSceneBuilder\.ScenePath/);
 assert.match(editor,/LoadAssetAtPath<SceneAsset>\(DistrictScene\)/);
 assert.match(editor,/SaveScene\(district\)/);
 assert.doesNotMatch(editor,/DeleteAsset\(|SaveScene\(source, TFMTrainingSceneBuilder\.ScenePath/);
});
test("district map has world materials, collision and mobile-appropriate authored structures",()=>{
 assert.match(editor,/BuildStreetNetwork\(/);
 assert.match(editor,/BuildIndustrialBlocks\(/);
 assert.match(editor,/BuildStreetFurniture\(/);
 assert.match(editor,/BuildPerimeter\(/);
 assert.match(editor,/TextureFormat\.RGBA32/);
 assert.match(editor,/texture\.EncodeToPNG\(\)/);
 assert.match(editor,/TextureImporterCompression\.Compressed/);
 assert.match(editor,/Universal Render Pipeline\/Lit/);
 assert.match(editor,/Block\(building, "Glass Bay /);
 assert.match(editor,/Block\(module, "Corrugated Steel Shell"/);
 assert.match(editor,/BuildCharacterPatrols\(hero, targets, arena\)/);
 assert.match(editor,/hitbox\.height = 1\.8f/);
 assert.match(editor,/child\.gameObject\.layer = 0/);
 assert.match(editor,/TFMDistrictPatrol/);
});
test("district unit patrol drives imported humanoid locomotion and retains hit/respawn anchors",()=>{
 assert.match(patrol,/RequireComponent\(typeof\(TFMTargetDummy\)\)/);
 assert.match(patrol,/if \(_target == null \|\| !_target\.IsAlive\)/);
 assert.match(patrol,/Vector3\.MoveTowards/);
 assert.match(patrol,/Animator\.StringToHash\("Speed"\)/);
 assert.match(patrol,/SetFloat\(SpeedId, speed/);
 assert.match(patrol,/applyRootMotion = false/);
 assert.match(editor,/TFMTargetDummy anchor/);
 assert.match(editor,/GetComponentsInChildren<SkinnedMeshRenderer>\(true\)/);
 assert.match(editor,/GetComponentsInChildren<Animator>\(true\)/);
});
test("district world runtime disables only the legacy training drill setup, not player services",()=>{
 assert.match(world,/class TFMWorldIdentity/);
 assert.match(bootstrap,/gameObject\.AddComponent<TFMAdaptiveFramePacer>\(\)/);
 assert.match(bootstrap,/GetComponent<TFMWorldIdentity>\(\) != null\) return/);
 assert.match(hud,/TFM · DISTRICT 01/);
 assert.match(hud,/TFMWorldIdentity/);
});

test("one-command production world generation runs real Unity batch authoring",()=>{
 assert.match(editor,/public static void BuildDistrictBatch\(\)/);
 assert.match(editor,/TFM_DISTRICT_BUILD_RESULT=SUCCESS/);
 assert.match(editor,/TFM_DISTRICT_BUILD_RESULT=FAILED/);
});
