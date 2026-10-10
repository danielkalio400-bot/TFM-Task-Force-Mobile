using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace TFM.Editor
{
    /// <summary>
    /// Unity 6 command-line build for the existing authored Training Yard.
    /// Generates a real player only when the Editor and platform modules exist.
    /// </summary>
    public static class TFMPlayableDemoBatchBuild
    {
        public static void Run()
        {
            try
            {
                string platform=RequiredArg("-tfmPlatform").ToLowerInvariant();
                string output=Path.GetFullPath(RequiredArg("-tfmOutput"));
                BuildTarget target;
                BuildTargetGroup group;
                if(platform=="android")
                {
                    target=BuildTarget.Android;
                    group=BuildTargetGroup.Android;
                    if(!output.EndsWith(".apk",StringComparison.OrdinalIgnoreCase))
                        throw new InvalidOperationException("Android output must end in .apk");
                    EditorUserBuildSettings.buildAppBundle=false;
                }
                else if(platform=="windows")
                {
                    target=BuildTarget.StandaloneWindows64;
                    group=BuildTargetGroup.Standalone;
                    if(!output.EndsWith(".exe",StringComparison.OrdinalIgnoreCase))
                        throw new InvalidOperationException("Windows output must end in .exe");
                }
                else if(platform=="ios")
                {
                    if(Application.platform!=RuntimePlatform.OSXEditor)
                        throw new InvalidOperationException("iOS Xcode export requires macOS Unity Editor");
                    target=BuildTarget.iOS;
                    group=BuildTargetGroup.iOS;
                }
                else throw new InvalidOperationException("Unsupported TFM demo platform: "+platform);

                if(!BuildPipeline.IsBuildTargetSupported(group,target))
                    throw new InvalidOperationException("Unity platform build module not installed for "+platform);
                if(EditorUserBuildSettings.activeBuildTarget!=target)
                    throw new InvalidOperationException("Run Unity with matching -buildTarget for "+platform);

                // Existing scene is preserved. The validator creates a
                // starter scene only when no authored yard exists yet.
                TFMTrainingSceneBuilder.ValidateTrainingScene();
                string parent=platform=="ios" ? output : Path.GetDirectoryName(output);
                if(string.IsNullOrWhiteSpace(parent))
                    throw new InvalidOperationException("Build output directory required");
                Directory.CreateDirectory(parent);
                BuildReport report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{
                    scenes=new [] {TFMTrainingSceneBuilder.ScenePath},
                    locationPathName=output,
                    target=target,
                    options=BuildOptions.Development
                });
                if(report==null || report.summary.result!=BuildResult.Succeeded)
                    throw new InvalidOperationException("Unity did not produce a successful TFM player build");
                Debug.Log("TFM player built by Unity for "+platform+" at "+output);
                EditorApplication.Exit(0);
            }
            catch(Exception error)
            {
                Debug.LogException(error);
                EditorApplication.Exit(1);
            }
        }

        private static string RequiredArg(string key)
        {
            string[] args=Environment.GetCommandLineArgs();
            for(int i=0;i<args.Length;i++)
                if(string.Equals(args[i],key,StringComparison.OrdinalIgnoreCase))
                {
                    if(i+1<args.Length && !args[i+1].StartsWith("-") &&
                       !string.IsNullOrWhiteSpace(args[i+1]))
                        return args[i+1];
                    break;
                }
            throw new ArgumentException("Missing required Unity argument "+key);
        }
    }
}
