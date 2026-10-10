import {existsSync,statSync,openSync,closeSync,readSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";

function safeStat(path){
 try{return statSync(path);}catch{return null;}
}
function readAt(fd,bytes,position){
 const out=Buffer.alloc(bytes);
 if(readSync(fd,out,0,bytes,position)!==bytes)return null;
 return out;
}
function sha256File(path){
 const fd=openSync(path,"r"),hash=createHash("sha256");
 try{
  const buffer=Buffer.alloc(1024*1024);
  let count;
  while((count=readSync(fd,buffer,0,buffer.length,null))>0)
    hash.update(buffer.subarray(0,count));
  return hash.digest("hex");
 }finally{closeSync(fd);}
}
function validApk(path,size){
 // Inspect ZIP central directory, not just the .apk extension or PK prefix.
 // Reject multi-volume and ZIP64 entries: these are not expected for demo APKs.
 if(size<44)return false;
 const fd=openSync(path,"r");
 try{
  const tailSize=Math.min(size,65557);
  const tail=readAt(fd,tailSize,size-tailSize);
  if(!tail)return false;
  let index=-1;
  for(let i=tail.length-22;i>=0;i--){
   if(tail.readUInt32LE(i)===0x06054b50 &&
      i+22+tail.readUInt16LE(i+20)===tail.length){index=i;break;}
  }
  if(index<0||tail.readUInt16LE(index+4)!==0||
     tail.readUInt16LE(index+6)!==0)return false;
  const entries=tail.readUInt16LE(index+10);
  const bytes=tail.readUInt32LE(index+12);
  const start=tail.readUInt32LE(index+16);
  if(entries<3||entries===65535||bytes<46||bytes>32*1024*1024||
     start+bytes>size-tailSize+index || start+bytes>size)return false;
  const directory=readAt(fd,bytes,start);
  if(!directory)return false;
  let pos=0,manifest=false,classes=false,unity=false;
  for(let i=0;i<entries;i++){
   if(pos+46>directory.length||
      directory.readUInt32LE(pos)!==0x02014b50)return false;
   const nameBytes=directory.readUInt16LE(pos+28);
   const extra=directory.readUInt16LE(pos+30);
   const comment=directory.readUInt16LE(pos+32);
   const next=pos+46+nameBytes+extra+comment;
   if(nameBytes===0||next>directory.length)return false;
   const name=directory.toString("utf8",pos+46,pos+46+nameBytes);
   if(name==="AndroidManifest.xml")manifest=true;
   if(name==="classes.dex"||/^classes\d+\.dex$/.test(name))classes=true;
   if(name.startsWith("assets/bin/Data/")||
     /^lib\/[^/]+\/lib(?:unity|il2cpp|main)\.so$/.test(name))unity=true;
   pos=next;
  }
  return pos===bytes&&manifest&&classes&&unity;
 }finally{closeSync(fd);}
}
function validWindows(path,size){
 if(size<128)return false;
 const fd=openSync(path,"r");
 try{
  const header=readAt(fd,64,0);
  if(!header||header.toString("ascii",0,2)!=="MZ")return false;
  const peOffset=header.readUInt32LE(0x3c);
  if(peOffset<64||peOffset>size-24)return false;
  const pe=readAt(fd,24,peOffset);
  if(!pe||pe.toString("binary",0,4)!=="PE\u0000\u0000")return false;
  const machine=pe.readUInt16LE(4);
  if(machine!==0x8664)return false; // Win64 only
  const data=path.slice(0,-4)+"_Data";
  return safeStat(data)?.isDirectory()===true &&
   ["globalgamemanagers","resources.assets"].some(file=>
     safeStat(join(data,file))?.isFile()===true);
 }finally{closeSync(fd);}
}
function validXcode(output){
 const folder=join(output,"Unity-iPhone.xcodeproj");
 const file=join(folder,"project.pbxproj");
 const stat=safeStat(file);
 if(!safeStat(folder)?.isDirectory()||!stat?.isFile()||
    stat.size<30||stat.size>64*1024*1024)return false;
 const fd=openSync(file,"r");
 try{
  const bytes=Math.min(stat.size,128*1024);
  const prefix=readAt(fd,bytes,0);
  return prefix!==null&&prefix.toString("utf8").includes("PBXProject");
 }finally{closeSync(fd);}
}
export function inspectUnityArtifact({platform,output}={}){
 if(typeof output!=="string"||!output.trim()||
    !["android","windows","ios"].includes(platform))
   return {ok:false,error:"invalid_artifact_request"};
 try{
  if(platform==="ios")
   return validXcode(output)?
    {ok:true,platform,kind:"xcode-project",nativeAppSigned:false}:
    {ok:false,error:"xcode_project_missing_or_invalid"};
  const stat=safeStat(output);
  if(!stat?.isFile()||stat.size===0)
   return {ok:false,error:"player_binary_missing"};
  const valid=platform==="android"?validApk(output,stat.size):
    validWindows(output,stat.size);
  if(!valid)
   return {ok:false,error:platform==="android"?
     "apk_contents_not_verified":"windows_player_structure_not_verified"};
  return {ok:true,platform,sizeBytes:stat.size,sha256:sha256File(output),
    kind:platform==="android"?"apk":"windows-pe64"};
 }catch{
  return {ok:false,error:"artifact_validation_io_failure"};
 }
}
