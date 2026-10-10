import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,writeFileSync,mkdirSync,rmSync}
 from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {parseOptions,unityArguments,verifyDemoArtifact,runCli}
 from "../scripts/unity-demo-build.mjs";

test("target-specific Unity command lines require an explicit valid output",()=>{
 for(const [platform,suffix,target] of [
  ["android",".apk","Android"],["windows",".exe","Win64"],
  ["ios","-Xcode","iOS"]]){
  const o=parseOptions(["--unity","/fake/unity","--project","/fake/demo",
    "--platform",platform,"--output","/tmp/TFM"+suffix]);
  const a=unityArguments(o);
  assert.ok(a.includes("-batchmode"));
  assert.ok(a.includes("-nographics"));
  assert.equal(a[a.indexOf("-buildTarget")+1],target);
  assert.equal(a[a.indexOf("-executeMethod")+1],
    "TFM.Editor.TFMPlayableDemoBatchBuild.Run");
  assert.equal(a[a.indexOf("-tfmOutput")+1],o.output);
 }
 assert.throws(()=>parseOptions(["--platform","android"]),/unity_project_and_output_required/);
 assert.throws(()=>parseOptions(["--unity","x","--project","y",
    "--platform","android","--output","missing.exe"]),/android_output_must_be_apk/);
});
test("the build command only accepts inspected real-format outputs",()=>{
 const folder=mkdtempSync(join(tmpdir(),"source-only-"));
 try{
  const apk=join(folder,"demo.apk");
  writeFileSync(apk,"ordinary text is not an Android game");
  assert.equal(verifyDemoArtifact({platform:"android",output:apk}),false);
  const exe=join(folder,"demo.exe");
  writeFileSync(exe,"text");mkdirSync(join(folder,"demo_Data"));
  assert.equal(verifyDemoArtifact({platform:"windows",output:exe}),false);
  const xcode=join(folder,"xcode");mkdirSync(xcode);
  mkdirSync(join(xcode,"Unity-iPhone.xcodeproj"));
  assert.equal(verifyDemoArtifact({platform:"ios",output:xcode}),false);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
test("project readiness fails without real Unity project, never generates fake game files",()=>{
 const folder=mkdtempSync(join(tmpdir(),"tfm-empty-"));
 try{
  assert.throws(()=>runCli(["--unity",join(folder,"Unity"),
    "--project",folder,"--platform","android",
    "--output",join(folder,"demo.apk")]),
    /unity_project_missing_assets_or_project_settings/);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
test("Unity C# builder validates project scene and builds rather than claiming an artifact",()=>{
 const base=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
 const src=readFileSync(new URL("Editor/TFMPlayableDemoBatchBuild.cs",base),"utf8");
 const manifest=readFileSync(new URL("TFM-Source-Manifest.txt",base),"utf8");
 assert.match(src,/BuildPipeline.BuildPlayer/);
 assert.match(src,/TFMTrainingSceneBuilder.ValidateTrainingScene/);
 assert.match(src,/BuildReport/);
 assert.match(src,/EditorApplication.Exit\(1\)/);
 assert.match(src,/BuildTarget.Android/);
 assert.match(src,/BuildTarget.StandaloneWindows64/);
 assert.match(src,/BuildTarget.iOS/);
 assert.match(manifest,/Editor\/TFMPlayableDemoBatchBuild.cs/);
});
