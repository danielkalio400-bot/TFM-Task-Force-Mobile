using System;
using System.Collections.Generic;
using System.Linq;
using TFM.Gameplay.Combat;
using TFM.Player.Movement;
using TFM.Presentation;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace TFM.Editor
{
    // Installs real imported artist-authored prefabs, never simulated high-fidelity geometry.
    // The scene is marked dirty for review; the designer explicitly saves the result.
    public static class TFMProductionArtInstaller
    {
        private const string ScenePath = TFMTrainingSceneBuilder.ScenePath;
        private static readonly HashSet<string> OriginalArenaBlocks =
            new HashSet<string>(StringComparer.Ordinal)
            {
                "Ground", "North Wall", "South Wall", "East Wall", "West Wall",
                "Center Cover", "West Cover", "East Cover", "North Platform",
                "South Platform", "Center Marker"
            };

        [MenuItem("TFM/Production Art/Apply Imported Prefabs")]
        public static void Apply()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Exit Play Mode before applying production art.");

            Scene scene = SceneManager.GetActiveScene();
            if (!scene.isLoaded || scene.path != ScenePath)
                throw new InvalidOperationException("Open the saved TFM Training Yard scene first.");

            TFMProductionArtProfile profile = LoadProfile();
            ValidatePrefab(profile.OperatorPrefab, "operator", false);
            if (!profile.OperatorPrefab.GetComponentsInChildren<Animator>(true)
                .Any(animator => animator.avatar != null && animator.avatar.isHuman))
                throw new InvalidOperationException("Operator requires a rigged Humanoid Avatar and Animator.");
            ValidatePrefab(profile.EnvironmentPrefab, "environment", true);
            ValidatePrefab(profile.PracticeTargetPrefab, "practice target", true);

            TFMThirdPersonMotor[] players = Find<TFMThirdPersonMotor>(scene);
            TFMTargetDummy[] targets = Find<TFMTargetDummy>(scene);
            Transform arena = Find<Transform>(scene)
                .FirstOrDefault(t => t.name == "Training Yard");
            if (players.Length != 1 || targets.Length != 3 || arena == null)
                throw new InvalidOperationException("Expected one player, three practice targets and a Training Yard. No changes made.");

            // All validation happens before any modification to the authored scene.
            GameObject avatar = PlacePrefab(profile.OperatorPrefab, players[0].transform,
                "TFM Production Operator");
            TFMOperatorMotionBridge motion = avatar.GetComponent<TFMOperatorMotionBridge>();
            if (motion == null) motion = Undo.AddComponent<TFMOperatorMotionBridge>(avatar);
            Undo.RecordObject(motion, "Bind TFM operator motion");
            motion.Configure(players[0].transform);
            // The gameplay motor is authoritative. Imported avatar colliders must not
            // occlude the camera's ray cast or intercept shots fired from the camera.
            SetOperatorRaycastLayer(avatar);
            HideLegacy(players[0].transform.Find("Player Visual"));

            PlacePrefab(profile.EnvironmentPrefab, arena, "TFM Production Environment");
            foreach (Transform child in arena)
            {
                if (OriginalArenaBlocks.Contains(child.name))
                    HideLegacy(child);
            }

            foreach (TFMTargetDummy target in targets)
            {
                PlacePrefab(profile.PracticeTargetPrefab, target.transform,
                    "TFM Production Practice Target");
                HideLegacy(target.transform.Find("Body"));
                HideLegacy(target.transform.Find("Head"));
            }

            EditorSceneManager.MarkSceneDirty(scene);
            Debug.Log("TFM production prefabs installed in the open scene. Review collisions, rigging, animation, scale and art placement, then save the scene.");
        }

        [MenuItem("TFM/Production Art/Validate Open Scene")]
        public static void Validate()
        {
            Scene scene = SceneManager.GetActiveScene();
            if (!scene.isLoaded || scene.path != ScenePath)
                throw new InvalidOperationException("Open the saved TFM Training Yard first.");
            TFMProductionArtProfile profile = LoadProfile();
            TFMThirdPersonMotor[] players = Find<TFMThirdPersonMotor>(scene);
            TFMTargetDummy[] targets = Find<TFMTargetDummy>(scene);
            Transform arena = Find<Transform>(scene)
                .FirstOrDefault(t => t.name == "Training Yard");
            if (players.Length != 1 || targets.Length != 3 || arena == null)
                throw new InvalidOperationException("Training Yard actor anchors are incomplete.");

            VerifyInstalled(players[0].transform.Find("TFM Production Operator"),
                profile.OperatorPrefab, "operator", false, true);
            VerifyInstalled(arena.Find("TFM Production Environment"),
                profile.EnvironmentPrefab, "environment", true, false);
            foreach (TFMTargetDummy target in targets)
                VerifyInstalled(target.transform.Find("TFM Production Practice Target"),
                    profile.PracticeTargetPrefab, "practice target", true, false);

            if (LegacyRendererVisible(players[0].transform.Find("Player Visual")) ||
                targets.Any(target =>
                    LegacyRendererVisible(target.transform.Find("Body")) ||
                    LegacyRendererVisible(target.transform.Find("Head"))) ||
                Find<Transform>(scene).Any(part =>
                    part.parent == arena && OriginalArenaBlocks.Contains(part.name) &&
                    LegacyRendererVisible(part)))
                throw new InvalidOperationException(
                    "Original training-yard blockout mesh is still rendered.");

            Transform operatorVisual = players[0].transform.Find("TFM Production Operator");
            int raycastExclusion = LayerMask.NameToLayer("Ignore Raycast");
            if (raycastExclusion < 0 || operatorVisual == null ||
                operatorVisual.GetComponentsInChildren<Transform>(true)
                    .Any(part => part.gameObject.layer != raycastExclusion))
                throw new InvalidOperationException(
                    "Operator geometry must be on the Ignore Raycast layer to avoid self-occlusion.");

            Debug.Log("TFM production art, preserved gameplay anchors, collision and camera raycast exclusions verified. Manual visual/device QA remains required.");
        }

        // Audit the installed prefab instance rather than an unrelated renamed object.
        private static void VerifyInstalled(Transform instance, GameObject expected,
            string label, bool requireCollider, bool requireHumanoid)
        {
            if (instance == null || !instance.gameObject.activeInHierarchy)
                throw new InvalidOperationException("Missing or inactive production " + label);
            GameObject source = PrefabUtility.GetCorrespondingObjectFromSource(instance.gameObject);
            if (expected == null || source != expected)
                throw new InvalidOperationException(
                    "Production " + label + " is not an instance of the assigned prefab.");

            Renderer[] renderers = instance.GetComponentsInChildren<Renderer>(true);
            if (!renderers.Any(renderer =>
                renderer != null && renderer.enabled && renderer.gameObject.activeInHierarchy))
                throw new InvalidOperationException(
                    "Production " + label + " has no active visible renderers.");

            if (requireCollider && !instance.GetComponentsInChildren<Collider>(true)
                .Any(collider => collider != null && collider.enabled &&
                    collider.gameObject.activeInHierarchy && !collider.isTrigger))
                throw new InvalidOperationException(
                    "Production " + label + " needs an enabled non-trigger physical collider.");

            if (requireHumanoid && !instance.GetComponentsInChildren<Animator>(true)
                .Any(animator => animator != null && animator.enabled &&
                    animator.gameObject.activeInHierarchy &&
                    animator.avatar != null && animator.avatar.isHuman &&
                    animator.runtimeAnimatorController != null))
                throw new InvalidOperationException(
                    "Production " + label + " needs an enabled Humanoid Animator with a controller.");
        }

        private static T[] Find<T>(Scene scene) where T : Component =>
            scene.GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<T>(true))
                .ToArray();

        private static TFMProductionArtProfile LoadProfile()
        {
            string[] ids = AssetDatabase.FindAssets("t:TFMProductionArtProfile");
            if (ids.Length != 1)
                throw new InvalidOperationException(
                    "Create and assign exactly one TFM Production Art Profile in Assets. Found: " + ids.Length);
            TFMProductionArtProfile result = AssetDatabase.LoadAssetAtPath<TFMProductionArtProfile>(
                AssetDatabase.GUIDToAssetPath(ids[0]));
            if (result == null)
                throw new InvalidOperationException("Production art profile could not be loaded.");
            return result;
        }

        private static void ValidatePrefab(GameObject prefab, string label, bool needsCollider)
        {
            if (prefab == null || !PrefabUtility.IsPartOfPrefabAsset(prefab))
                throw new InvalidOperationException("Assign an imported prefab asset for " + label + ".");
            if (prefab.GetComponentsInChildren<Renderer>(true).Length == 0)
                throw new InvalidOperationException(label + " must contain visible renderer geometry.");
            if (needsCollider && prefab.GetComponentsInChildren<Collider>(true).Length == 0)
                throw new InvalidOperationException(label + " must contain functional colliders.");
        }

        private static GameObject PlacePrefab(GameObject prefab, Transform parent, string name)
        {
            // Do not overwrite locally adjusted or artist-authored prefab instances.
            if (parent.Find(name) != null) return parent.Find(name).gameObject;
            GameObject instance = PrefabUtility.InstantiatePrefab(prefab, parent.gameObject.scene)
                as GameObject;
            if (instance == null)
                throw new InvalidOperationException("Unable to instantiate production prefab " + name);
            Undo.RegisterCreatedObjectUndo(instance, "Install TFM production art");
            instance.name = name;
            instance.transform.SetParent(parent, false);
            instance.transform.localPosition = Vector3.zero;
            instance.transform.localRotation = Quaternion.identity;
            instance.transform.localScale = Vector3.one;
            return instance;
        }

        private static bool LegacyRendererVisible(Transform legacy)
        {
            if (legacy == null || !legacy.gameObject.activeInHierarchy) return false;
            Renderer renderer = legacy.GetComponent<Renderer>();
            return renderer != null && renderer.enabled;
        }

        private static void SetOperatorRaycastLayer(GameObject avatar)
        {
            int ignoreRaycastLayer = LayerMask.NameToLayer("Ignore Raycast");
            if (ignoreRaycastLayer < 0)
                throw new InvalidOperationException("Unity Ignore Raycast layer is missing.");
            foreach (Transform part in avatar.GetComponentsInChildren<Transform>(true))
            {
                if (part.gameObject.layer == ignoreRaycastLayer) continue;
                Undo.RecordObject(part.gameObject, "Exclude operator visual from aiming");
                part.gameObject.layer = ignoreRaycastLayer;
            }
        }

        private static void HideLegacy(Transform legacy)
        {
            if (legacy == null) return;
            // Never deactivate scene anchors; other gameplay components and authored
            // child objects must remain active after the production mesh is installed.
            Renderer renderer = legacy.GetComponent<Renderer>();
            if (renderer != null && renderer.enabled)
            {
                Undo.RecordObject(renderer, "Hide TFM legacy renderer");
                renderer.enabled = false;
            }
            Collider collider = legacy.GetComponent<Collider>();
            if (collider != null && collider.enabled)
            {
                Undo.RecordObject(collider, "Replace TFM legacy collision");
                collider.enabled = false;
            }
        }
    }
}
