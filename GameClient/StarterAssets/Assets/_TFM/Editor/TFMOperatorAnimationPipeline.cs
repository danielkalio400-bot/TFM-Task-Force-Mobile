#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using TFM.Player.Movement;
using TFM.Presentation;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace TFM.Editor
{
    /// <summary>
    /// Non-destructive humanoid animation import for a user-owned operator.
    /// Requires real, properly licensed FBX clips; never fabricates movements.
    /// </summary>
    public static class TFMOperatorAnimationPipeline
    {
        public const string AnimationRoot = "Assets/_TFM/ProductionArt/Animations";
        public const string Imports = AnimationRoot + "/Imports";
        public const string Generated = AnimationRoot + "/Generated";
        public const string ControllerPath = Generated + "/TFMOperator.controller";
        private const string CharacterPath =
            "Assets/_TFM/ProductionArt/Operators/character.fbx";

        private sealed class ClipSet
        {
            public AnimationClip Idle;
            public AnimationClip Walk;
            public AnimationClip Run;
            public AnimationClip Fire;
            public AnimationClip Reload;
            public AnimationClip Aim;
        }

        [MenuItem("TFM/Operator/Animations/1 - Prepare Animation Folders")]
        public static void PrepareFolders()
        {
            GuardEditor();
            EnsureFolder(Imports);
            EnsureFolder(Generated);
            AssetDatabase.Refresh();
            Debug.Log("TFM animation folders prepared at " + Imports +
                ". Import licensed Idle.fbx, Walk.fbx, Run.fbx and optional Fire.fbx / Reload.fbx there.");
        }

        [MenuItem("TFM/Operator/Animations/2 - Configure Imported Humanoid Clips")]
        public static void ConfigureImports()
        {
            GuardEditor();
            EnsureFolder(Imports);
            GameObject mainCharacter = AssetDatabase.LoadAssetAtPath<GameObject>(CharacterPath);
            if (mainCharacter == null || !mainCharacter.GetComponentsInChildren<Animator>(true)
                .Any(a => a.avatar != null && a.avatar.isValid && a.avatar.isHuman))
                throw new InvalidOperationException(
                    "Import and configure a valid humanoid character.fbx first.");

            string[] paths = AssetDatabase.FindAssets("t:GameObject", new[] { Imports })
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(p => p.EndsWith(".fbx", StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.Ordinal)
                .OrderBy(p => p, StringComparer.Ordinal)
                .ToArray();

            if (paths.Length == 0)
                throw new InvalidOperationException(
                    "No FBX files in " + Imports + ". Supply licensed animation clips first.");

            int reimported = 0;
            foreach (string path in paths)
            {
                ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;
                if (importer == null)
                    throw new InvalidOperationException("Unsupported animation importer: " + path);

                // The FBX's own rig is interpreted as Humanoid. Unity's Humanoid
                // retargeting maps muscle animation onto the player's Avatar;
                // do not CopyFromOther unless skeletons are identical.
                bool changed = importer.animationType != ModelImporterAnimationType.Human ||
                    importer.avatarSetup != ModelImporterAvatarSetup.CreateFromThisModel ||
                    !importer.importAnimation;
                importer.animationType = ModelImporterAnimationType.Human;
                importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
                importer.importAnimation = true;

                ModelImporterClipAnimation[] configurations = importer.clipAnimations;
                if (configurations == null || configurations.Length == 0)
                    configurations = importer.defaultClipAnimations;
                if (configurations != null && configurations.Length > 0)
                {
                    string filename = Path.GetFileNameWithoutExtension(path);
                    foreach (ModelImporterClipAnimation entry in configurations)
                    {
                        string category = Classify(filename + " " + entry.name);
                        if (category == "Idle" || category == "Walk" || category == "Run")
                        {
                            if (!entry.loopTime)
                            {
                                entry.loopTime = true;
                                changed = true;
                            }
                        }
                    }
                    importer.clipAnimations = configurations;
                }

                if (!changed) continue;
                importer.SaveAndReimport();
                reimported++;
            }

            Debug.Log("TFM imported Humanoid FBX checked: " + paths.Length +
                "; updated: " + reimported +
                ". Next choose TFM > Operator > Animations > 3 - Audit Animation Clips.");
        }

        [MenuItem("TFM/Operator/Animations/3 - Audit Animation Clips")]
        public static void Audit()
        {
            GuardEditor();
            ClipSet clips = CollectClips();
            var message = new StringBuilder();
            message.AppendLine("TFM HUMANOID ANIMATION READINESS");
            AppendState(message, "Idle", clips.Idle);
            AppendState(message, "Walk", clips.Walk);
            AppendState(message, "Run", clips.Run);
            AppendState(message, "Fire (optional)", clips.Fire);
            AppendState(message, "Reload (optional)", clips.Reload);
            AppendState(message, "Aim (not wired; no ADS input)", clips.Aim);
            message.AppendLine("All locomotion clips must be humanoid (Humanoid rig).");
            message.AppendLine("No animation clips are bundled with TFM source.");
            Debug.Log(message.ToString());
            if (!Application.isBatchMode)
                EditorUtility.DisplayDialog("TFM animation audit", message.ToString(), "OK");
        }

        [MenuItem("TFM/Operator/Animations/4 - Build and Bind Locomotion")]
        public static void BuildAndBind()
        {
            GuardEditor();
            Scene scene = SceneManager.GetActiveScene();
            if (scene.path != TFMTrainingSceneBuilder.ScenePath || !scene.isLoaded)
                throw new InvalidOperationException(
                    "Open TFM > Open Training Yard before binding animations.");

            ClipSet clips = CollectClips();
            if (clips.Idle == null || clips.Walk == null || clips.Run == null)
                throw new InvalidOperationException(
                    "Idle, Walk and Run humanoid clips are all required. Run the audit.");

            TFMThirdPersonMotor[] players = scene.GetRootGameObjects()
                .SelectMany(g => g.GetComponentsInChildren<TFMThirdPersonMotor>(true)).ToArray();
            if (players.Length != 1)
                throw new InvalidOperationException("Expected exactly one existing TFM player.");

            Transform operatorRoot = players[0].transform.Find("TFM Production Operator");
            if (operatorRoot == null)
                throw new InvalidOperationException(
                    "Install the existing textured TFM Production Operator first.");

            Animator[] found = operatorRoot.GetComponentsInChildren<Animator>(true)
                .Where(a => a.avatar != null && a.avatar.isValid && a.avatar.isHuman).ToArray();
            if (found.Length != 1)
                throw new InvalidOperationException(
                    "Expected exactly one Animator with a valid Humanoid Avatar on the operator.");

            EnsureFolder(Generated);
            AnimatorController controller =
                AssetDatabase.LoadAssetAtPath<AnimatorController>(ControllerPath);
            if (controller == null)
            {
                if (AssetDatabase.LoadMainAssetAtPath(ControllerPath) != null)
                    throw new InvalidOperationException(
                        "Refusing to overwrite a non-controller asset at " + ControllerPath);
                controller = CreateController(clips);
            }
            else
            {
                // Treat a previously generated controller as user art:
                // rebind without overwriting potentially hand-edited states.
                if (!controller.parameters.Any(p => p.name == "Speed" &&
                        p.type == AnimatorControllerParameterType.Float))
                    throw new InvalidOperationException(
                        "Existing TFM controller has no Float Speed parameter. Inspect it manually.");
            }

            Animator animator = found[0];
            Undo.RecordObject(animator, "Bind TFM animation controller");
            animator.runtimeAnimatorController = controller;
            animator.applyRootMotion = false;
            PrefabUtility.RecordPrefabInstancePropertyModifications(animator);

            TFMOperatorMotionBridge bridge =
                operatorRoot.GetComponent<TFMOperatorMotionBridge>();
            if (bridge == null)
                bridge = Undo.AddComponent<TFMOperatorMotionBridge>(operatorRoot.gameObject);
            Undo.RecordObject(bridge, "Bind TFM movement animation source");
            bridge.Configure(players[0].transform);
            PrefabUtility.RecordPrefabInstancePropertyModifications(bridge);

            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            EditorSceneManager.MarkSceneDirty(scene);
            Debug.Log("TFM locomotion Animator Controller bound to the existing textured operator. " +
                "Original FBX and materials unchanged. Save the scene (Ctrl+S) and press Play. " +
                "Root motion stays disabled; the TFM motor owns movement.");
        }

        // Safe command-line diagnostics; does not load or save user scenes.
        public static void AuditBatch()
        {
            try
            {
                Audit();
                EditorApplication.Exit(0);
            }
            catch (Exception error)
            {
                Debug.LogException(error);
                EditorApplication.Exit(1);
            }
        }

        private static AnimatorController CreateController(ClipSet clips)
        {
            AnimatorController controller =
                AnimatorController.CreateAnimatorControllerAtPath(ControllerPath);
            controller.AddParameter("Speed", AnimatorControllerParameterType.Float);
            controller.AddParameter("IsMoving", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Grounded", AnimatorControllerParameterType.Bool);
            controller.AddParameter("IsFiring", AnimatorControllerParameterType.Bool);
            controller.AddParameter("IsReloading", AnimatorControllerParameterType.Bool);

            AnimatorStateMachine machine = controller.layers[0].stateMachine;
            var blend = new BlendTree
            {
                name = "TFM Idle-Walk-Run",
                blendType = BlendTreeType.Simple1D,
                blendParameter = "Speed",
                useAutomaticThresholds = false
            };
            AssetDatabase.AddObjectToAsset(blend, controller);
            blend.AddChild(clips.Idle, 0f);
            blend.AddChild(clips.Walk, 0.67f);
            blend.AddChild(clips.Run, 1f);

            AnimatorState locomotion = machine.AddState("Locomotion");
            locomotion.motion = blend;
            machine.defaultState = locomotion;

            // These optional author-created clips use the existing offline
            // practice weapon's true firing/reload state, not fake timelines.
            if (clips.Fire != null)
                AddActionState(machine, locomotion, "Fire", clips.Fire, "IsFiring");
            if (clips.Reload != null)
                AddActionState(machine, locomotion, "Reload", clips.Reload, "IsReloading");

            EditorUtility.SetDirty(blend);
            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            return controller;
        }

        private static void AddActionState(AnimatorStateMachine machine,
            AnimatorState locomotion, string stateName, AnimationClip clip,
            string parameter)
        {
            AnimatorState action = machine.AddState(stateName);
            action.motion = clip;
            AnimatorStateTransition enter = machine.AddAnyStateTransition(action);
            enter.hasExitTime = false;
            enter.duration = 0.08f;
            enter.canTransitionToSelf = false;
            enter.AddCondition(AnimatorConditionMode.If, 0f, parameter);

            AnimatorStateTransition exit = action.AddTransition(locomotion);
            exit.hasExitTime = false;
            exit.duration = 0.10f;
            exit.AddCondition(AnimatorConditionMode.IfNot, 0f, parameter);
        }

        private static ClipSet CollectClips()
        {
            if (!AssetDatabase.IsValidFolder(Imports))
                return new ClipSet();
            var output = new ClipSet();
            var buckets = new Dictionary<string, List<AnimationClip>>(StringComparer.Ordinal);
            string[] paths = AssetDatabase.FindAssets("t:AnimationClip", new[] { Imports })
                .Select(AssetDatabase.GUIDToAssetPath).Distinct(StringComparer.Ordinal)
                .OrderBy(p => p, StringComparer.Ordinal).ToArray();
            foreach (string path in paths)
            {
                string filename = Path.GetFileNameWithoutExtension(path);
                foreach (AnimationClip clip in AssetDatabase.LoadAllAssetsAtPath(path).OfType<AnimationClip>())
                {
                    if (clip.name.StartsWith("__preview__", StringComparison.OrdinalIgnoreCase))
                        continue;
                    string category = Classify(filename + " " + clip.name);
                    if (category == null) continue;
                    if (!clip.humanMotion)
                        throw new InvalidOperationException(
                            category + " clip is not Humanoid: " + path + " > " + clip.name +
                            ". Run Configure Imported Humanoid Clips and inspect the FBX Rig.");
                    if (!buckets.ContainsKey(category))
                        buckets[category] = new List<AnimationClip>();
                    buckets[category].Add(clip);
                }
            }
            // Ambiguous motion choices are dangerous: never select one at random.
            foreach (KeyValuePair<string, List<AnimationClip>> entry in buckets)
                if (entry.Value.Count > 1)
                    throw new InvalidOperationException(
                        "Multiple " + entry.Key + " animation clips found (" +
                        entry.Value.Count + "). Keep exactly one named " +
                        entry.Key + " clip in Imports before building.");
            output.Idle = Get(buckets, "Idle");
            output.Walk = Get(buckets, "Walk");
            output.Run = Get(buckets, "Run");
            output.Fire = Get(buckets, "Fire");
            output.Reload = Get(buckets, "Reload");
            output.Aim = Get(buckets, "Aim");
            return output;
        }

        private static AnimationClip Get(Dictionary<string, List<AnimationClip>> clips, string name)
        {
            return clips.TryGetValue(name, out List<AnimationClip> options) ? options[0] : null;
        }

        private static string Classify(string name)
        {
            name = name.ToLowerInvariant();
            if (name.Contains("reload")) return "Reload";
            if (name.Contains("sprint") || name.Contains("running") ||
                name.Contains("run")) return "Run";
            if (name.Contains("walking") || name.Contains("walk")) return "Walk";
            if (name.Contains("idle")) return "Idle";
            if (name.Contains("shoot") || name.Contains("firing") ||
                name.Contains("fire")) return "Fire";
            if (name.Contains("aim")) return "Aim";
            return null;
        }

        private static void AppendState(StringBuilder output, string name, AnimationClip clip)
        {
            output.AppendLine(name + ": " +
                (clip == null ? "MISSING" : "Humanoid " + clip.length.ToString("F2") +
                "s | " + AssetDatabase.GetAssetPath(clip) + " > " + clip.name));
        }

        private static void EnsureFolder(string path)
        {
            if (path == "Assets" || AssetDatabase.IsValidFolder(path)) return;
            string parent = path.Substring(0, path.LastIndexOf('/'));
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, path.Substring(path.LastIndexOf('/') + 1));
        }

        private static void GuardEditor()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException(
                    "Exit Play Mode before importing and configuring operator animations.");
        }
    }
}
#endif
