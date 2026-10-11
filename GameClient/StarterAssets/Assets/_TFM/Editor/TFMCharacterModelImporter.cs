#if UNITY_EDITOR
using System;
using System.Linq;
using TFM.Presentation;
using UnityEditor;
using UnityEngine;

namespace TFM.Editor
{
    /// <summary>
    /// Configures a user-imported humanoid FBX for TFM without modifying the source file,
    /// overwriting existing art profiles or fabricating character animations.
    /// </summary>
    public static class TFMCharacterModelImporter
    {
        [MenuItem("TFM/Production Art/Configure and Assign Selected Character FBX")]
        public static void ConfigureSelected()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Exit Play Mode before changing FBX import settings.");
            string assetPath = AssetDatabase.GetAssetPath(Selection.activeObject);
            if (string.IsNullOrEmpty(assetPath) ||
                !assetPath.EndsWith(".fbx", StringComparison.OrdinalIgnoreCase) ||
                !assetPath.StartsWith("Assets/", StringComparison.Ordinal))
                throw new InvalidOperationException("Select an imported FBX under the Unity Assets folder.");

            ModelImporter modelImporter = AssetImporter.GetAtPath(assetPath) as ModelImporter;
            if (modelImporter == null)
                throw new InvalidOperationException("The selected asset is not a supported model importer.");

            // Mixamo-compatible humanoid rig; the Avatar will still be validated by Unity.
            modelImporter.animationType = ModelImporterAnimationType.Human;
            modelImporter.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
            modelImporter.importCameras = false;
            modelImporter.importLights = false;
            modelImporter.isReadable = false;
            modelImporter.SaveAndReimport();

            Avatar avatar = AssetDatabase.LoadAllAssetsAtPath(assetPath)
                .OfType<Avatar>().FirstOrDefault(a => a.isValid && a.isHuman);
            if (avatar == null)
                throw new InvalidOperationException(
                    "Unity did not create a valid Humanoid Avatar. Select the FBX > Rig > Configure and fix bone mapping before proceeding.");

            GameObject model = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
            if (model == null || model.GetComponentsInChildren<Renderer>(true).Length == 0)
                throw new InvalidOperationException("FBX has no renderable character model.");
            if (!PrefabUtility.IsPartOfPrefabAsset(model))
                throw new InvalidOperationException("Imported FBX is not a supported prefab asset.");

            TFMProductionArtProfile profile = FindOrCreateProfile();
            SerializedObject serialized = new SerializedObject(profile);
            SerializedProperty selected = serialized.FindProperty("operatorPrefab");
            if (selected == null)
                throw new InvalidOperationException("TFMProductionArtProfile operatorPrefab field is missing.");
            if (selected.objectReferenceValue != null && selected.objectReferenceValue != model)
                throw new InvalidOperationException(
                    "The TFM art profile already has a different operator. Clear it explicitly before replacing it.");
            selected.objectReferenceValue = model;
            serialized.ApplyModifiedProperties();
            EditorUtility.SetDirty(profile);
            AssetDatabase.SaveAssets();
            Debug.Log("TFM FBX configured: Humanoid Avatar validated and model assigned to production art profile. " +
                "Now configure URP/Lit materials, assign an Animator Controller and import authored animations. " +
                "Environment and practice target prefabs are also required before applying production art to the training scene.");
        }

        [MenuItem("TFM/Production Art/Configure and Assign Selected Character FBX", true)]
        private static bool CanConfigureSelected()
        {
            string assetPath = AssetDatabase.GetAssetPath(Selection.activeObject);
            return !EditorApplication.isPlayingOrWillChangePlaymode &&
                !string.IsNullOrEmpty(assetPath) &&
                assetPath.EndsWith(".fbx", StringComparison.OrdinalIgnoreCase) &&
                assetPath.StartsWith("Assets/", StringComparison.Ordinal);
        }

        private static TFMProductionArtProfile FindOrCreateProfile()
        {
            string[] ids = AssetDatabase.FindAssets("t:TFMProductionArtProfile");
            if (ids.Length > 1)
                throw new InvalidOperationException(
                    "Multiple TFM Production Art Profiles found; consolidate them before assigning character art.");
            if (ids.Length == 1)
            {
                TFMProductionArtProfile existing = AssetDatabase.LoadAssetAtPath<TFMProductionArtProfile>(
                    AssetDatabase.GUIDToAssetPath(ids[0]));
                if (existing == null) throw new InvalidOperationException("Production Art Profile failed to load.");
                return existing;
            }
            TFMProductionArtProfile created = ScriptableObject.CreateInstance<TFMProductionArtProfile>();
            string path = AssetDatabase.GenerateUniqueAssetPath("Assets/_TFM/TFMProductionArtProfile.asset");
            AssetDatabase.CreateAsset(created, path);
            return created;
        }
    }
}
#endif
