#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace TFM.Editor
{
    /// <summary>
    /// Converts verified locally downloaded CC0 photo PBR maps into URP Lit
    /// materials already used by the separate saved District 01 scene.
    /// Never changes the operator, user FBX or authored animation assets.
    /// </summary>
    public static class TFMDistrictPbrImporter
    {
        private const string Root = "Assets/_TFM/Worlds/District01";
        private static readonly string[] Surfaces = { "road", "brick", "concrete", "metal" };

        [MenuItem("TFM/Worlds/Apply Downloaded CC0 Materials")]
        public static void Apply()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Exit Play Mode before editing materials.");
            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(
                TFMDistrictWorldBuilder.DistrictScene) == null)
                throw new InvalidOperationException("District 01 scene has not been created.");

            string packedRoot = Root + "/Packed";
            if (!AssetDatabase.IsValidFolder(packedRoot))
                AssetDatabase.CreateFolder(Root, "Packed");
            int applied = 0;
            foreach (string key in Surfaces)
            {
                string folder = Root + "/PhotoPBR/" + key + "/";
                string diffusePath = AssetMap(folder, key + "_Diffuse");
                string normalPath = AssetMap(folder, key + "_Normal");
                string roughPath = AssetMap(folder, key + "_Rough");
                Texture2D diffuse = AssetDatabase.LoadAssetAtPath<Texture2D>(diffusePath);
                Texture2D normal = AssetDatabase.LoadAssetAtPath<Texture2D>(normalPath);
                Texture2D roughness = AssetDatabase.LoadAssetAtPath<Texture2D>(roughPath);
                if (diffuse == null || normal == null || roughness == null)
                {
                    Debug.LogWarning("TFM CC0 PBR incomplete for " + key +
                        "; existing procedural surface preserved.");
                    continue;
                }

                // AssetDatabase.CreateAsset can name the material after the
                // asset filename (TFM-road), even when its constructor name is
                // "TFM Original road". Do not use material.name as provenance.
                string materialPath = Root + "/Materials/TFM-" + key + ".mat";
                Material material = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
                if (material == null)
                    throw new InvalidOperationException(
                        "TFM generated surface material not found: " + materialPath);
                if (AssetDatabase.GetAssetPath(material) != materialPath ||
                    material.shader == null ||
                    material.shader.name != "Universal Render Pipeline/Lit")
                    throw new InvalidOperationException(
                        "Refusing to edit a non-URP or non-TFM asset at " + materialPath);

                // Confirm the current albedo points either to the exact
                // originally generated map or to this PBR pass's diffuse file.
                // This avoids changing artist-replaced materials in-place.
                Texture currentAlbedo = material.GetTexture("_BaseMap");
                string currentAlbedoPath = AssetDatabase.GetAssetPath(currentAlbedo);
                string originalAlbedoPath = Root + "/Textures/TFM-" + key + ".png";
                if (currentAlbedoPath != originalAlbedoPath &&
                    currentAlbedoPath != diffusePath)
                    throw new InvalidOperationException(
                        "TFM " + key + " material has a custom albedo at " +
                        currentAlbedoPath + "; preserving it. Expected " +
                        originalAlbedoPath + " or " + diffusePath);

                TextureImporter normalImporter =
                    AssetImporter.GetAtPath(normalPath) as TextureImporter;
                if (normalImporter == null)
                    throw new InvalidOperationException("Normal map importer absent: " + normalPath);
                if (normalImporter.textureType != TextureImporterType.NormalMap)
                {
                    normalImporter.textureType = TextureImporterType.NormalMap;
                    normalImporter.SaveAndReimport();
                }
                normal = AssetDatabase.LoadAssetAtPath<Texture2D>(normalPath);
                string metallicPath = packedRoot + "/TFM-" + key + "-MetallicSmooth.png";
                Texture2D metallicGloss =
                    AssetDatabase.LoadAssetAtPath<Texture2D>(metallicPath);
                if (metallicGloss == null)
                {
                    TextureImporter importer =
                        AssetImporter.GetAtPath(roughPath) as TextureImporter;
                    if (importer == null)
                        throw new InvalidOperationException("Roughness importer missing: " + roughPath);
                    bool originalReadable = importer.isReadable;
                    bool originalSrgb = importer.sRGBTexture;
                    try
                    {
                        if (!originalReadable || originalSrgb)
                        {
                            importer.isReadable = true;
                            importer.sRGBTexture = false;
                            importer.SaveAndReimport();
                        }
                        roughness = AssetDatabase.LoadAssetAtPath<Texture2D>(roughPath);
                        Color[] pixels = roughness.GetPixels();
                        float metallic = key == "metal" ? 0.75f : 0.02f;
                        for (int i = 0; i < pixels.Length; i++)
                            pixels[i] = new Color(metallic, 0f, 0f,
                                1f - Mathf.Clamp01(pixels[i].grayscale));
                        var packed = new Texture2D(roughness.width, roughness.height,
                            TextureFormat.RGBA32, false, true);
                        packed.SetPixels(pixels);
                        packed.Apply();
                        File.WriteAllBytes(metallicPath, packed.EncodeToPNG());
                        UnityEngine.Object.DestroyImmediate(packed);
                        AssetDatabase.ImportAsset(metallicPath);
                        TextureImporter outputImporter =
                            AssetImporter.GetAtPath(metallicPath) as TextureImporter;
                        if (outputImporter != null)
                        {
                            outputImporter.sRGBTexture = false;
                            outputImporter.mipmapEnabled = true;
                            outputImporter.textureCompression =
                                TextureImporterCompression.Compressed;
                            outputImporter.SaveAndReimport();
                        }
                    }
                    finally
                    {
                        TextureImporter restore =
                            AssetImporter.GetAtPath(roughPath) as TextureImporter;
                        if (restore != null &&
                            (restore.isReadable != originalReadable ||
                             restore.sRGBTexture != originalSrgb))
                        {
                            restore.isReadable = originalReadable;
                            restore.sRGBTexture = originalSrgb;
                            restore.SaveAndReimport();
                        }
                    }
                    metallicGloss = AssetDatabase.LoadAssetAtPath<Texture2D>(metallicPath);
                }
                if (metallicGloss == null)
                    throw new InvalidOperationException("Cannot import packed PBR map: " + key);

                Undo.RecordObject(material, "TFM photographed CC0 PBR surface");
                material.SetColor("_BaseColor", Color.white);
                material.SetTexture("_BaseMap", diffuse);
                material.SetTexture("_BumpMap", normal);
                material.SetFloat("_BumpScale", 0.9f);
                material.EnableKeyword("_NORMALMAP");
                material.SetTexture("_MetallicGlossMap", metallicGloss);
                material.EnableKeyword("_METALLICSPECGLOSSMAP");
                material.SetFloat("_Metallic", 1f);
                material.SetFloat("_Smoothness", 1f);
                material.SetTextureScale("_BaseMap", Vector2.one * 3f);
                material.SetTextureScale("_BumpMap", Vector2.one * 3f);
                material.SetTextureScale("_MetallicGlossMap", Vector2.one * 3f);
                EditorUtility.SetDirty(material);
                applied++;
            }

            if (applied == 0)
                throw new InvalidOperationException("No complete CC0 PBR sets were imported.");
            AssetDatabase.SaveAssets();
            Debug.Log("TFM_PBR_RESULT=SUCCESS surfaces=" + applied);
        }

        public static void Batch()
        {
            try { Apply(); EditorApplication.Exit(0); }
            catch (Exception error) { Debug.LogException(error); EditorApplication.Exit(1); }
        }

        private static string AssetMap(string folder, string name)
        {
            foreach (string extension in new[] { ".jpg", ".png" })
            {
                string candidate = folder + name + extension;
                if (AssetDatabase.LoadAssetAtPath<Texture2D>(candidate) != null)
                    return candidate;
            }
            return folder + name + ".jpg";
        }
    }
}
#endif
