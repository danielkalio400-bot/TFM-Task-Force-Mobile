import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
test("TFM character import verifies Humanoid avatar and safeguards art profile",()=>{
 const source=read("Editor/TFMCharacterModelImporter.cs");
 const manifest=read("TFM-Source-Manifest.txt");
 assert.match(source,/ModelImporterAnimationType\.Human/);
 assert.match(source,/ModelImporterAvatarSetup\.CreateFromThisModel/);
 assert.match(source,/a\.isValid && a\.isHuman/);
 assert.match(source,/TFMProductionArtProfile/);
 assert.match(source,/selected\.objectReferenceValue != null/);
 assert.match(source,/serialized\.ApplyModifiedProperties\(\)/);
 assert.match(source,/SaveAndReimport\(\)/);
 assert.doesNotMatch(source,/AssetDatabase\.DeleteAsset/);
 assert.equal(manifest.split(/\r?\n/).filter(p=>p==="Editor/TFMCharacterModelImporter.cs").length,1);
});
