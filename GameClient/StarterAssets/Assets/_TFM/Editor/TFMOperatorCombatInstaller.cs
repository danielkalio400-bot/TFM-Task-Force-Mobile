#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using TFM.Player.Movement;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace TFM.Editor
{
    /// <summary>
    /// Optional authored upper-body animation layer. ADS camera, touch button,
    /// practice shot feedback, and procedural pose fallback run without action FBXs.
    /// </summary>
    public static class TFMOperatorCombatInstaller
    {
        private const string LayerName = "TFM Combat Upper";
        private const string MaskPath =
            "Assets/_TFM/ProductionArt/Animations/Generated/TFMUpperBody.mask";

        [MenuItem("TFM/Operator/Combat/Auto-Integrate Combat Presentation")]
        public static void AutoIntegrate()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Exit Play Mode before modifying animation assets.");
            Scene scene = SceneManager.GetActiveScene();
            if (!scene.isLoaded || scene.path != TFMTrainingSceneBuilder.ScenePath)
                throw new InvalidOperationException(
                    "Open TFM > Open Training Yard before integrating operator animations.");

            TFMThirdPersonMotor[] motors = scene.GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<TFMThirdPersonMotor>(true))
                .ToArray();
            if (motors.Length != 1)
                throw new InvalidOperationException("Expected exactly one existing TFM player.");
            Transform op = motors[0].transform.Find("TFM Production Operator");
            if (op == null)
                throw new InvalidOperationException("Existing textured TFM operator not found.");
            Animator[] animators = op.GetComponentsInChildren<Animator>(true)
                .Where(a => a.avatar != null && a.avatar.isValid && a.avatar.isHuman)
                .ToArray();
            if (animators.Length != 1)
                throw new InvalidOperationException("Expected one valid Humanoid Animator.");
            Animator animator = animators[0];
            AnimatorController controller =
                AssetDatabase.LoadAssetAtPath<AnimatorController>(
                    TFMOperatorAnimationPipeline.ControllerPath);
            if (controller == null || animator.runtimeAnimatorController != controller)
                throw new InvalidOperationException(
                    "Run TFM > Operator > Animations > 4 - Build and Bind Locomotion first.");

            EnsureParameter(controller, "IsAiming");
            EnsureParameter(controller, "IsFiring");
            EnsureParameter(controller, "IsReloading");

            var clips = FindActions();
            if (clips.Count == 0)
            {
                AssetDatabase.SaveAssets();
                Debug.Log("TFM ADS and practice visual feedback are active through runtime scripts. " +
                    "No Fire/Reload/Aim authored FBXs found, so no upper-body layer was added. " +
                    "Import optional clips and run Auto-Integrate again.");
                return;
            }

            AvatarMask mask = AssetDatabase.LoadAssetAtPath<AvatarMask>(MaskPath);
            if (mask == null)
            {
                if (AssetDatabase.LoadMainAssetAtPath(MaskPath) != null)
                    throw new InvalidOperationException("Refusing to overwrite asset at " + MaskPath);
                mask = new AvatarMask();
                // Animation only for torso, arms, head; legs remain driven by
                // the authoritative locomotion base layer.
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.Root, false);
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.Body, true);
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.Head, true);
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.LeftLeg, false);
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.RightLeg, false);
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.LeftArm, true);
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.RightArm, true);
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.LeftFingers, true);
                mask.SetHumanoidBodyPartActive(AvatarMaskBodyPart.RightFingers, true);
                AssetDatabase.CreateAsset(mask, MaskPath);
            }

            AnimatorControllerLayer layer = controller.layers
                .FirstOrDefault(l => l.name == LayerName);
            if (layer == null)
            {
                AnimatorStateMachine machine = new AnimatorStateMachine
                {
                    name = LayerName + " State Machine"
                };
                AssetDatabase.AddObjectToAsset(machine, controller);
                AnimatorState idle = machine.AddState("Neutral");
                machine.defaultState = idle;
                layer = new AnimatorControllerLayer
                {
                    name = LayerName,
                    avatarMask = mask,
                    blendingMode = AnimatorLayerBlendingMode.Override,
                    defaultWeight = 1f,
                    stateMachine = machine
                };
                controller.AddLayer(layer);
            }
            else if (layer.avatarMask != mask)
            {
                throw new InvalidOperationException(
                    "Existing combat layer uses a different AvatarMask; inspect before changing.");
            }

            AnimatorStateMachine sm = layer.stateMachine;
            AnimatorState neutral = sm.states
                .Select(x => x.state).FirstOrDefault(x => x.name == "Neutral");
            if (neutral == null)
                throw new InvalidOperationException(
                    "Existing combat layer has no Neutral state; refusing to mutate custom setup.");

            int created = 0;
            if (clips.TryGetValue("Reload", out AnimationClip reload))
                created += AddAction(sm, neutral, "Reload", reload, "IsReloading");
            if (clips.TryGetValue("Fire", out AnimationClip fire))
                created += AddAction(sm, neutral, "Fire", fire, "IsFiring");
            if (clips.TryGetValue("Aim", out AnimationClip aim))
                created += AddAction(sm, neutral, "Aim", aim, "IsAiming");

            EditorUtility.SetDirty(sm);
            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            EditorSceneManager.MarkSceneDirty(scene);
            Debug.Log("TFM combat upper-body animation integrated; new states: " + created +
                ". Existing locomotion, face/body textures and scene geometry preserved. " +
                "Ctrl+S to save, then inspect ADS and practice action clips in Play Mode.");
        }

        private static void EnsureParameter(AnimatorController controller, string name)
        {
            AnimatorControllerParameter existing =
                controller.parameters.FirstOrDefault(x => x.name == name);
            if (existing != null && existing.type != AnimatorControllerParameterType.Bool)
                throw new InvalidOperationException("Animation parameter " + name + " must be Bool.");
            if (existing == null)
                controller.AddParameter(name, AnimatorControllerParameterType.Bool);
        }

        private static int AddAction(AnimatorStateMachine sm, AnimatorState neutral,
            string stateName, AnimationClip clip, string parameter)
        {
            if (sm.states.Any(x => x.state.name == stateName)) return 0;
            AnimatorState state = sm.AddState(stateName);
            state.motion = clip;
            AnimatorStateTransition enter = sm.AddAnyStateTransition(state);
            enter.hasExitTime = false;
            enter.canTransitionToSelf = false;
            enter.duration = 0.08f;
            enter.AddCondition(AnimatorConditionMode.If, 0f, parameter);
            // Reload takes priority. Avoid entering Fire/Aim during reload.
            if (stateName != "Reload")
                enter.AddCondition(AnimatorConditionMode.IfNot, 0f, "IsReloading");
            if (stateName == "Aim")
                enter.AddCondition(AnimatorConditionMode.IfNot, 0f, "IsFiring");
            AnimatorStateTransition leave = state.AddTransition(neutral);
            leave.hasExitTime = false;
            leave.duration = 0.10f;
            leave.AddCondition(AnimatorConditionMode.IfNot, 0f, parameter);
            return 1;
        }

        private static Dictionary<string, AnimationClip> FindActions()
        {
            var found = new Dictionary<string, AnimationClip>(StringComparer.Ordinal);
            string folder = TFMOperatorAnimationPipeline.Imports;
            if (!AssetDatabase.IsValidFolder(folder)) return found;
            string[] paths = AssetDatabase.FindAssets("t:AnimationClip", new[] { folder })
                .Select(AssetDatabase.GUIDToAssetPath)
                .Distinct(StringComparer.Ordinal).OrderBy(p => p, StringComparer.Ordinal)
                .ToArray();
            foreach (string path in paths)
            {
                string filename = Path.GetFileNameWithoutExtension(path).ToLowerInvariant();
                foreach (AnimationClip clip in AssetDatabase.LoadAllAssetsAtPath(path)
                    .OfType<AnimationClip>())
                {
                    if (clip.name.StartsWith("__preview__", StringComparison.OrdinalIgnoreCase))
                        continue;
                    string name = filename + " " + clip.name.ToLowerInvariant();
                    string action = name.Contains("reload") ? "Reload" :
                        (name.Contains("firing") || name.Contains("shoot") ||
                        name.Contains("fire")) ? "Fire" :
                        name.Contains("aim") ? "Aim" : null;
                    if (action == null) continue;
                    if (!clip.humanMotion)
                        throw new InvalidOperationException("Clip is not humanoid: " + path);
                    if (found.ContainsKey(action))
                        throw new InvalidOperationException(
                            "Duplicate " + action + " animation clips in " + folder);
                    found.Add(action, clip);
                }
            }
            return found;
        }
    }
}
#endif
