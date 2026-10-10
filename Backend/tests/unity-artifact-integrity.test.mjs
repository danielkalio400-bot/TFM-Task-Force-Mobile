import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {inspectUnityArtifact as inspect}
 from "../src/services/unity-artifact-integrity.mjs";

// Tiny structural fixtures. These are NOT compiled games or release packages.
function zipFixture(names){
 const entries=names.map(name=>{
  const label=Buffer.from(name,"utf8");
  const header=Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50,0);
  header.writeUInt16LE(label.length,28);
  return Buffer.concat([header,label]);
 });
 const directory=Buffer.concat(entries);
 const eocd=Buffer.alloc(22);
 eocd.writeUInt32LE(0x06054b50,0);
 eocd.writeUInt16LE(names.length,8);
 eocd.writeUInt16LE(names.length,10);
 eocd.writeUInt32LE(directory.length,12);
 return Buffer.concat([directory,eocd]);
}
function pe64Fixture(){
 const b=Buffer.alloc(160);
 b.write("MZ",0,"ascii");
 b.writeUInt32LE(80,0x3c);
 b.write("PE\u0000\u0000",80,"binary");
 b.writeUInt16LE(0x8664,84);
 return b;
}
test("Android APK verification rejects text, broken ZIP and missing Android contents",()=>{
 const dir=mkdtempSync(join(tmpdir(),"unity-integrity-"));
 try{
  const file=join(dir,"world.apk");
  writeFileSync(file,"pretend game");
  assert.equal(inspect({platform:"android",output:file}).ok,false);
  writeFileSync(file,zipFixture(["AndroidManifest.xml","classes.dex","readme"]));
  assert.equal(inspect({platform:"android",output:file}).ok,false);
  writeFileSync(file,zipFixture(["AndroidManifest.xml","classes.dex",
   "assets/bin/Data/globalgamemanagers"]));
  const positive=inspect({platform:"android",output:file});
  assert.equal(positive.ok,true);
  assert.match(positive.sha256,/^[0-9a-f]{64}$/);
  assert.equal(positive.sizeBytes,readFileSync(file).length);
  const broken=readFileSync(file);broken.writeUInt32LE(0,0);
  writeFileSync(file,broken);
  assert.equal(inspect({platform:"android",output:file}).ok,false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("Windows requires PE64 signature, Unity asset folder and a real Unity data file",()=>{
 const dir=mkdtempSync(join(tmpdir(),"unity-integrity-"));
 try{
  const exe=join(dir,"Prototype.exe"),data=join(dir,"Prototype_Data");
  writeFileSync(exe,"not an exe");mkdirSync(data);
  writeFileSync(join(data,"globalgamemanagers"),"fixture");
  assert.equal(inspect({platform:"windows",output:exe}).ok,false);
  writeFileSync(exe,pe64Fixture());
  assert.equal(inspect({platform:"windows",output:exe}).ok,true);
  const corrupted=pe64Fixture();corrupted.writeUInt16LE(0x14c,84);
  writeFileSync(exe,corrupted);
  assert.equal(inspect({platform:"windows",output:exe}).ok,false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("iOS Xcode export needs an actual pbxproj, never claims a signed IPA",()=>{
 const dir=mkdtempSync(join(tmpdir(),"unity-integrity-"));
 try{
  const output=join(dir,"iOS");mkdirSync(output);
  const proj=join(output,"Unity-iPhone.xcodeproj");mkdirSync(proj);
  assert.equal(inspect({platform:"ios",output}).ok,false);
  writeFileSync(join(proj,"project.pbxproj"),"invalid");
  assert.equal(inspect({platform:"ios",output}).ok,false);
  writeFileSync(join(proj,"project.pbxproj"),
    "// !$*UTF8*$!\n/* Begin PBXProject section */\nPBXProject /* fixture */");
  const result=inspect({platform:"ios",output});
  assert.equal(result.ok,true);
  assert.equal(result.nativeAppSigned,false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("invalid path, absent package and unknown platform fail closed",()=>{
 assert.equal(inspect({platform:"android",output:"/no/artifact.apk"}).ok,false);
 assert.equal(inspect({platform:"windows",output:"/no/artifact.exe"}).ok,false);
 assert.equal(inspect({platform:"unknown",output:"/no/artifact"}).ok,false);
});
