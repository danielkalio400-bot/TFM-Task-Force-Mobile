#!/usr/bin/env node
import {existsSync,statSync} from "node:fs";
import {resolve,join,dirname} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

export function parseOptions(args){
 const flags=new Map();
 for(let i=0;i<args.length;i++){
   const key=args[i];
   if(!["--unity","--project","--platform","--output","--dry-run"].includes(key))
     throw new Error("unknown_argument:"+key);
   if(flags.has(key))throw new Error("duplicate_argument:"+key);
   if(key==="--dry-run"){flags.set(key,true);continue;}
   if(i+1>=args.length||args[i+1].startsWith("--"))
     throw new Error("missing_value:"+key);
   flags.set(key,args[++i]);
 }
 const platform=(flags.get("--platform")||"").toLowerCase();
 if(!["android","windows","ios"].includes(platform))
   throw new Error("platform_required_android_windows_ios");
 if(!flags.get("--unity")||!flags.get("--project")||!flags.get("--output"))
   throw new Error("unity_project_and_output_required");
 const project=resolve(flags.get("--project"));
 const output=resolve(flags.get("--output"));
 const unity=resolve(flags.get("--unity"));
 if(platform==="android"&&!output.toLowerCase().endsWith(".apk"))
   throw new Error("android_output_must_be_apk");
 if(platform==="windows"&&!output.toLowerCase().endsWith(".exe"))
   throw new Error("windows_output_must_be_exe");
 return {platform,unity,project,output,dryRun:!!flags.get("--dry-run")};
}
export function unityArguments({project,platform,output}){
 return ["-batchmode","-nographics","-quit","-projectPath",project,
   "-buildTarget",{android:"Android",windows:"Win64",ios:"iOS"}[platform],
   "-executeMethod","TFM.Editor.TFMPlayableDemoBatchBuild.Run",
   "-tfmPlatform",platform,"-tfmOutput",output];
}
export function verifyDemoArtifact({platform,output}){
 if(platform==="ios")
   return existsSync(join(output,"Unity-iPhone.xcodeproj"));
 if(!existsSync(output)||!statSync(output).isFile()||
    statSync(output).size===0)return false;
 if(platform==="windows"){
   const base=output.slice(0,-4);
   return existsSync(base+"_Data")&&statSync(base+"_Data").isDirectory();
 }
 return true;
}
export function runCli(argv){
 const options=parseOptions(argv);
 if(!existsSync(join(options.project,"Assets"))||
    !existsSync(join(options.project,"ProjectSettings","ProjectVersion.txt")))
   throw new Error("unity_project_missing_assets_or_project_settings");
 if(options.platform==="ios"&&process.platform!=="darwin")
   throw new Error("ios_export_requires_macos");
 if(!existsSync(options.unity))throw new Error("unity_editor_executable_not_found");
 const args=unityArguments(options);
 if(options.dryRun){
   console.log(JSON.stringify({mode:"dry-run",unity:options.unity,args,buildVerified:false},null,2));
   return;
 }
 const previous=verifyDemoArtifact(options);
 if(previous)throw new Error("output_already_exists_remove_or_choose_a_fresh_path");
 const result=spawnSync(options.unity,args,{stdio:"inherit",timeout:3600000});
 if(result.error)throw result.error;
 if(result.status!==0)
   throw new Error("unity_demo_build_failed_exit_"+result.status);
 if(!verifyDemoArtifact(options))
   throw new Error("unity_exited_without_verified_demo_artifact");
 console.log(JSON.stringify({platform:options.platform,output:options.output,
   artifactVerified:true,buildSizeNotPrescribed:true}));
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{runCli(process.argv.slice(2));}
 catch(error){console.error("TFM build: "+error.message);process.exitCode=1;}
}
