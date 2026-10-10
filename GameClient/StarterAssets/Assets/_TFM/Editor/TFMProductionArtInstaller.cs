using System;
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
            HideLegacy(players[0].transform.Find("Player Visual"));

            PlacePrefab(profile.EnvironmentPrefab, arena, "TFM Production Environment");
            foreach (Transform child in arena)
            {
                if (child.name == "TFM Production Environment" ||
                    child.GetComponent<TFMTargetDummy>() != null)
                    continue;
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
            TFMThirdPersonMotor[] players = Find<TFMThirdPersonMotor>(scene);
            TFMTargetDummy[] targets = Find<TFMTargetDummy>(scene);
            Transform arena = Find<Transform>(scene)
                .FirstOrDefault(t => t.name == "Training Yard");
            if (players.Length != 1 || targets.Length != 3 || arena == null ||
                players[0].transform.Find("TFM Production Operator") == null ||
                arena.Find("TFM Production Environment") == null ||
                targets.Any(t => t.transform.Find("TFM Production Practice Target") == null))
                throw new InvalidOperationException("Production prefabs are incomplete. This is not an art-ready scene.");
            Debug.Log("TFM art references present. Manual visual, collider and device QA is still required.");
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

        private static void HideLegacy(Transform legacy)
        {
            if (legacy == null || !legacy.gameObject.activeSelf) return;
            Undo.RecordObject(legacy.gameObject, "Hide TFM legacy visuals");
            legacy.gameObject.SetActive(false);
        }
    }
}
