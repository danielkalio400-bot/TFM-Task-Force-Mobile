using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using TFM.Gameplay.Combat;
using TFM.Gameplay.Prototype;
using TFM.Player.Camera;
using TFM.Player.Controls;
using TFM.Player.Movement;
using TFM.UI.HUD;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using Object = UnityEngine.Object;

namespace TFM.Editor
{
    // Runs only in the Editor; level geometry and references are saved by Unity itself.
    [InitializeOnLoad]
    public static class TFMTrainingSceneBuilder
    {
        public const string ScenePath = "Assets/_TFM/Scenes/TFMTrainingYard.unity";

        static TFMTrainingSceneBuilder()
        {
            EditorApplication.delayCall += FirstImport;
            EditorApplication.playModeStateChanged += OnPlayModeChanged;
        }

        private static void FirstImport()
        {
            if (Application.isBatchMode || EditorApplication.isPlayingOrWillChangePlaymode) return;
            if (EditorApplication.isCompiling || EditorApplication.isUpdating)
            {
                EditorApplication.delayCall += FirstImport;
                return;
            }
            if (File.Exists(ScenePath)) return;

            try
            {
                bool canOpen = SceneManager.sceneCount == 1 && !SceneManager.GetActiveScene().isDirty &&
                               (SceneManager.GetActiveScene().name == "SampleScene" ||
                                string.IsNullOrEmpty(SceneManager.GetActiveScene().path));
                EnsureScene();
                if (canOpen) OpenSavedScene();
                else Debug.Log("TFM scene created. Use TFM > Open Training Yard to open it.");
            }
            catch (Exception exception)
            {
                Debug.LogException(exception);
                Debug.LogError("TFM setup failed. Open Window > General > Console for the first error.");
            }
        }

        [MenuItem("TFM/Open Training Yard")]
        public static void OpenTrainingYard()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) return;
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            EnsureScene();
            OpenSavedScene();
        }

        private static void OpenSavedScene()
        {
            EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            ValidateLoadedScene(SceneManager.GetActiveScene());
            if (SceneView.lastActiveSceneView != null)
            {
                SceneView.lastActiveSceneView.LookAt(new Vector3(0f, 1f, 0f),
                    Quaternion.Euler(35f, 0f, 0f), 24f);
            }
            Debug.Log("TFM training scene is open. Press Play to move, shoot and reload.");
        }

        public static void EnsureScene()
        {
            if (File.Exists(ScenePath)) return; // Keep local level edits.
            Directory.CreateDirectory("Assets/_TFM/Scenes");
            Directory.CreateDirectory("Assets/_TFM/Materials/Training");
            AssetDatabase.Refresh();

            Scene previous = SceneManager.GetActiveScene();
            Scene generated = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Additive);
            SceneManager.SetActiveScene(generated);
            try
            {
                GameObject root = new GameObject("TFM Training Yard");
                TFMPrototypeBootstrap bootstrap = root.AddComponent<TFMPrototypeBootstrap>();
                bootstrap.BuildScene();
                foreach (Material material in bootstrap.GeneratedMaterials)
                {
                    string path = AssetDatabase.GenerateUniqueAssetPath(
                        "Assets/_TFM/Materials/Training/" + material.name + ".mat");
                    AssetDatabase.CreateAsset(material, path);
                }
                bootstrap.ReleaseGeneratedMaterialOwnership();
                ValidateLoadedScene(generated);
                AssetDatabase.SaveAssets();
                if (!EditorSceneManager.SaveScene(generated, ScenePath))
                    throw new InvalidOperationException("Unity could not save " + ScenePath);

                var scenes = new List<EditorBuildSettingsScene>
                {
                    new EditorBuildSettingsScene(ScenePath, true)
                };
                scenes.AddRange(EditorBuildSettings.scenes.Where(scene => scene.path != ScenePath));
                EditorBuildSettings.scenes = scenes.ToArray();
            }
            finally
            {
                if (previous.IsValid()) SceneManager.SetActiveScene(previous);
                EditorSceneManager.CloseScene(generated, true);
            }

            // Reopen from disk to catch lost serialized references, not just in-memory wiring.
            Scene reloaded = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Additive);
            try { ValidateLoadedScene(reloaded); }
            finally { EditorSceneManager.CloseScene(reloaded, true); }
        }

        [MenuItem("TFM/Validate Training Scene")]
        public static void ValidateTrainingScene()
        {
            EnsureScene();
            Scene loaded = SceneManager.GetSceneByPath(ScenePath);
            bool opened = !loaded.isLoaded;
            if (opened) loaded = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Additive);
            try
            {
                ValidateLoadedScene(loaded);
                Debug.Log("TFM validation passed: saved world, camera, movement, input, weapon, HUD and three targets.");
            }
            finally { if (opened) EditorSceneManager.CloseScene(loaded, true); }
        }

        private static void ValidateLoadedScene(Scene scene)
        {
            T[] Find<T>() where T : Component => scene.GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<T>(true)).ToArray();

            Require(Find<TFMPrototypeBootstrap>().Length == 1 && Find<TFMPrototypeBootstrap>()[0].SceneBuilt,
                "Scene needs exactly one built TFM level.");
            Require(Find<TFMThirdPersonMotor>().Length == 1, "Missing or duplicate player.");
            Require(Find<TFMPlayerInput>().Length == 1, "Missing or duplicate input.");
            Require(Find<TFMTargetDummy>().Length == 3, "Expected three targets.");
            Require(Find<Camera>().Length == 1 && Find<Camera>()[0].enabled, "Expected one enabled camera.");
            Require(Find<Renderer>().Length >= 10, "Level geometry is missing.");
            CheckReferences(Find<TFMThirdPersonMotor>().Single(), "_input", "_cameraTransform");
            CheckReferences(Find<TFMThirdPersonCamera>().Single(), "_input", "_target");
            CheckReferences(Find<TFMHitscanWeapon>().Single(), "_input", "_aimCamera");
            CheckReferences(Find<TFMPrototypeHud>().Single(), "_input", "_weapon");
            foreach (Renderer renderer in Find<Renderer>())
                Require(renderer.sharedMaterial != null, "Missing material: " + renderer.name);
        }

        private static void CheckReferences(Object component, params string[] fields)
        {
            var serialized = new SerializedObject(component);
            foreach (string field in fields)
            {
                SerializedProperty property = serialized.FindProperty(field);
                Require(property != null && property.objectReferenceValue != null,
                    component.name + ": missing serialized reference " + field);
            }
        }

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException("TFM validation: " + message);
        }

        private static void OnPlayModeChanged(PlayModeStateChange state)
        {
            if (state != PlayModeStateChange.EnteredPlayMode ||
                SceneManager.GetActiveScene().path != ScenePath) return;
            try
            {
                ValidateLoadedScene(SceneManager.GetActiveScene());
                Debug.Log("TFM Play Mode ready: player and training range loaded.");
            }
            catch (Exception exception) { Debug.LogException(exception); }
        }

        // Unity -batchmode -projectPath <project> -executeMethod TFM.Editor.TFMTrainingSceneBuilder.ValidateBatch -logFile <log>
        public static void ValidateBatch()
        {
            try { ValidateTrainingScene(); EditorApplication.Exit(0); }
            catch (Exception exception) { Debug.LogException(exception); EditorApplication.Exit(1); }
        }

        [MenuItem("TFM/Build Windows Training Demo")]
        public static void BuildWindowsDemo()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            ValidateTrainingScene();
            if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Standalone, BuildTarget.StandaloneWindows64))
                throw new InvalidOperationException("Install Windows Build Support in Unity Hub first.");
            string folder = EditorUtility.SaveFolderPanel("Choose a folder for the TFM demo", "", "TFM-Demo");
            if (string.IsNullOrEmpty(folder)) return;
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = Path.Combine(folder, "TFM.exe"),
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.Development
            });
            if (report.summary.result != UnityEditor.Build.Reporting.BuildResult.Succeeded)
                throw new InvalidOperationException("TFM build failed. Check the Console for build errors.");
            Debug.Log("TFM Windows demo built: " + Path.Combine(folder, "TFM.exe"));
        }
    }
}
