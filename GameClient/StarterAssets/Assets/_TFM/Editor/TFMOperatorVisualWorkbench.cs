#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using TFM.Player.Movement;
using TFM.Presentation;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace TFM.Editor
{
    /// <summary>
    /// Visible, original sci-fi cosmetic preview for a locally imported FBX.
    /// No third-party character meshes, animations or shaders are generated.
    /// All scene changes are Undo-aware and require explicit saving.
    /// </summary>
    public static class TFMOperatorVisualWorkbench
    {
        private const string ModelPath = "Assets/_TFM/ProductionArt/Operators/character.fbx";
        private const string GeneratedFolder = "Assets/_TFM/ProductionArt/Generated";
        private const string RingAsset = GeneratedFolder + "/TFMEnergyTorus.asset";
        private const string RingMaterial = GeneratedFolder + "/TFMEnergyCyan.mat";
        private const string TacticalMaterial = GeneratedFolder + "/TFMTacticalGraphite.mat";
        private const string VisorMaterial = GeneratedFolder + "/TFMTacticalCyan.mat";
        private const string PreviewRootName = "TFM Original Energy Preview";

        [MenuItem("TFM/Operator/Install FBX and Energy Preview")]
        public static void InstallPreview()
        {
            Scene scene = RequireTrainingScene();
            TFMThirdPersonMotor player = LocatePlayer(scene);
            Transform installed = player.transform.Find("TFM Production Operator");
            GameObject imported = AssetDatabase.LoadAssetAtPath<GameObject>(ModelPath);
            if (installed == null)
            {
                if (imported == null)
                    throw new InvalidOperationException("Import character.fbx into Assets/_TFM/ProductionArt/Operators first.");
                if (!HasValidHumanoid(imported))
                    throw new InvalidOperationException("FBX does not have a valid Humanoid Avatar. Configure FBX > Rig.");
                if (!imported.GetComponentsInChildren<Renderer>(true).Any())
                    throw new InvalidOperationException("FBX has no visible mesh. Obtain a skinned character mesh.");

                GameObject newInstance = PrefabUtility.InstantiatePrefab(imported, scene) as GameObject;
                if (newInstance == null)
                    throw new InvalidOperationException("Failed to instantiate character.fbx.");
                Undo.RegisterCreatedObjectUndo(newInstance, "Install TFM imported operator");
                newInstance.name = "TFM Production Operator";
                newInstance.transform.SetParent(player.transform, false);
                newInstance.transform.localPosition = Vector3.zero;
                newInstance.transform.localRotation = Quaternion.identity;
                newInstance.transform.localScale = Vector3.one;
                installed = newInstance.transform;
            }

            int ignoreRaycast = LayerMask.NameToLayer("Ignore Raycast");
            if (ignoreRaycast < 0)
                throw new InvalidOperationException("Missing Unity Ignore Raycast layer.");
            foreach (Transform bone in installed.GetComponentsInChildren<Transform>(true))
            {
                if (bone.gameObject.layer == ignoreRaycast) continue;
                Undo.RecordObject(bone.gameObject, "Exclude TFM operator from aiming");
                bone.gameObject.layer = ignoreRaycast;
            }

            TFMOperatorMotionBridge bridge = installed.GetComponent<TFMOperatorMotionBridge>();
            if (bridge == null) bridge = Undo.AddComponent<TFMOperatorMotionBridge>(installed.gameObject);
            Undo.RecordObject(bridge, "Bind TFM player to operator");
            bridge.Configure(player.transform);

            Transform oldVisual = player.transform.Find("Player Visual");
            if (oldVisual != null)
            {
                Renderer oldRenderer = oldVisual.GetComponent<Renderer>();
                if (oldRenderer != null && oldRenderer.enabled)
                {
                    Undo.RecordObject(oldRenderer, "Hide old TFM capsule");
                    oldRenderer.enabled = false;
                }
                Collider oldCollider = oldVisual.GetComponent<Collider>();
                if (oldCollider != null && oldCollider.enabled)
                {
                    Undo.RecordObject(oldCollider, "Disable primitive player collider");
                    oldCollider.enabled = false;
                }
            }

            EnsureGeneratedAssets();
            Transform visual = installed.Find(PreviewRootName);
            if (visual == null)
            {
                GameObject preview = new GameObject(PreviewRootName);
                Undo.RegisterCreatedObjectUndo(preview, "Add original TFM energy preview");
                preview.transform.SetParent(installed, false);
                preview.layer = ignoreRaycast;
                Transform lower = CreateRing(preview.transform, "Ground Ring",
                    new Vector3(0f, 0.09f, 0f), 1f, ignoreRaycast);
                Transform upper = CreateRing(preview.transform, "Waist Ring",
                    new Vector3(0f, 1.08f, 0f), 0.72f, ignoreRaycast);
                TFMOperatorEnergyAura aura = Undo.AddComponent<TFMOperatorEnergyAura>(preview);
                aura.Configure(lower, upper, lower.GetComponent<Renderer>(),
                    upper.GetComponent<Renderer>());
            }

            EditorSceneManager.MarkSceneDirty(scene);
            Debug.Log("TFM original cyan energy preview installed. Save scene (Ctrl+S) and Play. " +
                "This cosmetic effect does not create realistic armor, textures or walking animations.");
        }

        [MenuItem("TFM/Operator/Apply Tactical Material Preview")]
        public static void ApplyTacticalPreview()
        {
            Scene scene = RequireTrainingScene();
            Transform actor = LocatePlayer(scene).transform.Find("TFM Production Operator");
            if (actor == null)
                throw new InvalidOperationException("Install the FBX operator first.");
            EnsureGeneratedAssets();

            Material tactical = AssetDatabase.LoadAssetAtPath<Material>(TacticalMaterial);
            Material visor = AssetDatabase.LoadAssetAtPath<Material>(VisorMaterial);
            int changed = 0;
            foreach (Renderer renderer in actor.GetComponentsInChildren<Renderer>(true))
            {
                Transform fxRoot = actor.Find(PreviewRootName);
                if (fxRoot != null && renderer.transform.IsChildOf(fxRoot)) continue;
                if (renderer is ParticleSystemRenderer) continue;
                Material[] slots = renderer.sharedMaterials;
                bool updated = false;
                for (int i = 0; i < slots.Length; i++)
                {
                    Material current = slots[i];
                    if (current == tactical || current == visor || HasAuthoredTexture(current))
                        continue;
                    string name = current != null ? current.name.ToLowerInvariant() : string.Empty;
                    string objectName = renderer.gameObject.name.ToLowerInvariant();
                    // Preserve skin/face appearance for later proper texture import.
                    if (name.Contains("skin") || name.Contains("face") ||
                        objectName.Contains("face") || objectName.Contains("head"))
                        continue;
                    slots[i] = name.Contains("visor") || name.Contains("glass") ||
                        name.Contains("energy") ? visor : tactical;
                    updated = true;
                    changed++;
                }
                if (updated)
                {
                    Undo.RecordObject(renderer, "Apply original TFM tactical material preview");
                    renderer.sharedMaterials = slots;
                }
            }
            EditorSceneManager.MarkSceneDirty(scene);
            Debug.Log("TFM tactical preview: replaced " + changed +
                " untextured material slots; existing textured materials and face/skin preserved. " +
                "Use Edit > Undo to revert, or restore authored materials before final art.");
        }

        [MenuItem("TFM/Operator/Inspect Imported FBX")]
        public static void Inspect()
        {
            GameObject model = AssetDatabase.LoadAssetAtPath<GameObject>(ModelPath);
            if (model == null)
                throw new InvalidOperationException("Missing " + ModelPath);
            SkinnedMeshRenderer[] skinned = model.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            Renderer[] renderers = model.GetComponentsInChildren<Renderer>(true);
            Animator[] animators = model.GetComponentsInChildren<Animator>(true);
            int vertices = skinned.Sum(x => x.sharedMesh != null ? x.sharedMesh.vertexCount : 0);
            int triangles = skinned.Sum(x => x.sharedMesh != null ? x.sharedMesh.triangles.Length / 3 : 0);
            int materialSlots = renderers.Sum(x => x.sharedMaterials.Length);
            int texturedSlots = renderers.Sum(x => x.sharedMaterials.Count(HasAuthoredTexture));
            bool humanoid = HasValidHumanoid(model);
            bool controller = animators.Any(x => x.runtimeAnimatorController != null);
            int clips = AssetDatabase.LoadAllAssetsAtPath(ModelPath)
                .OfType<AnimationClip>()
                .Count(x => !x.name.StartsWith("__preview__", StringComparison.Ordinal));

            var report = new StringBuilder();
            report.AppendLine("Original TFM operator asset audit");
            report.AppendLine("Skinned meshes: " + skinned.Length);
            report.AppendLine("Mesh vertices: " + vertices + "; triangles: " + triangles);
            report.AppendLine("Texture-bearing material slots: " + texturedSlots + "/" + materialSlots);
            report.AppendLine("Humanoid Avatar: " + (humanoid ? "valid" : "MISSING / INVALID"));
            report.AppendLine("Animator Controller in FBX: " + (controller ? "present" : "MISSING"));
            report.AppendLine("Imported animation clips: " + clips);
            report.AppendLine();
            report.AppendLine("A valid rig is not a detailed 3D mesh. Texture, armor and " +
                "professionally authored clips are separate assets.");
            Debug.Log(report.ToString());
            EditorUtility.DisplayDialog("TFM operator readiness", report.ToString(), "OK");
        }

        private static bool HasValidHumanoid(GameObject model)
        {
            return model.GetComponentsInChildren<Animator>(true).Any(
                a => a.avatar != null && a.avatar.isValid && a.avatar.isHuman);
        }

        private static bool HasAuthoredTexture(Material material)
        {
            if (material == null) return false;
            return (material.HasProperty("_BaseMap") && material.GetTexture("_BaseMap") != null) ||
                   (material.HasProperty("_MainTex") && material.GetTexture("_MainTex") != null);
        }

        private static Scene RequireTrainingScene()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Exit Play Mode before editing production art.");
            Scene scene = SceneManager.GetActiveScene();
            if (!scene.isLoaded || scene.path != TFMTrainingSceneBuilder.ScenePath)
                throw new InvalidOperationException("Use TFM > Open Training Yard first.");
            return scene;
        }

        private static TFMThirdPersonMotor LocatePlayer(Scene scene)
        {
            TFMThirdPersonMotor[] all = scene.GetRootGameObjects()
                .SelectMany(x => x.GetComponentsInChildren<TFMThirdPersonMotor>(true))
                .ToArray();
            if (all.Length != 1)
                throw new InvalidOperationException("Expected exactly one TFM Third Person Motor.");
            return all[0];
        }

        private static void EnsureGeneratedAssets()
        {
            EnsureFolder(GeneratedFolder);
            if (AssetDatabase.LoadAssetAtPath<Mesh>(RingAsset) == null)
                AssetDatabase.CreateAsset(CreateRingMesh(), RingAsset);
            if (AssetDatabase.LoadAssetAtPath<Material>(RingMaterial) == null)
                AssetDatabase.CreateAsset(MakeMaterial("TFM Preview - Cyan Energy",
                    new Color(0.02f, 0.36f, 0.45f), true), RingMaterial);
            if (AssetDatabase.LoadAssetAtPath<Material>(TacticalMaterial) == null)
                AssetDatabase.CreateAsset(MakeMaterial("TFM Preview - Graphite",
                    new Color(0.09f, 0.12f, 0.16f), false), TacticalMaterial);
            if (AssetDatabase.LoadAssetAtPath<Material>(VisorMaterial) == null)
                AssetDatabase.CreateAsset(MakeMaterial("TFM Preview - Visor",
                    new Color(0.02f, 0.42f, 0.54f), true), VisorMaterial);
            AssetDatabase.SaveAssets();
        }

        private static Material MakeMaterial(string name, Color baseColor, bool emissive)
        {
            Shader lit = Shader.Find("Universal Render Pipeline/Lit");
            if (lit == null)
                throw new InvalidOperationException("TFM Operator Preview needs a Unity URP/Lit shader.");
            Material result = new Material(lit) { name = name };
            result.SetColor("_BaseColor", baseColor);
            result.SetFloat("_Metallic", emissive ? 0.35f : 0.72f);
            result.SetFloat("_Smoothness", emissive ? 0.88f : 0.4f);
            if (emissive)
            {
                result.EnableKeyword("_EMISSION");
                result.SetColor("_EmissionColor", new Color(0.1f, 2f, 2.8f));
                result.globalIlluminationFlags = MaterialGlobalIlluminationFlags.None;
            }
            return result;
        }

        private static Transform CreateRing(Transform parent, string name,
            Vector3 localPosition, float scale, int layer)
        {
            GameObject ring = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(ring, "Create original TFM energy ring");
            ring.transform.SetParent(parent, false);
            ring.transform.localPosition = localPosition;
            ring.transform.localScale = new Vector3(scale, 1f, scale);
            ring.layer = layer;
            MeshFilter filter = Undo.AddComponent<MeshFilter>(ring);
            filter.sharedMesh = AssetDatabase.LoadAssetAtPath<Mesh>(RingAsset);
            MeshRenderer renderer = Undo.AddComponent<MeshRenderer>(ring);
            renderer.sharedMaterial = AssetDatabase.LoadAssetAtPath<Material>(RingMaterial);
            renderer.shadowCastingMode = ShadowCastingMode.Off;
            renderer.receiveShadows = false;
            renderer.lightProbeUsage = LightProbeUsage.Off;
            renderer.reflectionProbeUsage = ReflectionProbeUsage.Off;
            return ring.transform;
        }

        private static Mesh CreateRingMesh()
        {
            const int segments = 64;
            const int tubeSides = 6;
            const float radius = 0.70f;
            const float tubeRadius = 0.014f;
            var vertices = new List<Vector3>();
            var uvs = new List<Vector2>();
            var indices = new List<int>();
            for (int s = 0; s <= segments; s++)
            {
                float a = s * Mathf.PI * 2f / segments;
                float ca = Mathf.Cos(a), sa = Mathf.Sin(a);
                for (int t = 0; t <= tubeSides; t++)
                {
                    float b = t * Mathf.PI * 2f / tubeSides;
                    float radial = radius + tubeRadius * Mathf.Cos(b);
                    vertices.Add(new Vector3(radial * ca,
                        tubeRadius * Mathf.Sin(b), radial * sa));
                    uvs.Add(new Vector2((float)s / segments, (float)t / tubeSides));
                }
            }
            for (int s = 0; s < segments; s++)
                for (int t = 0; t < tubeSides; t++)
                {
                    int n = s * (tubeSides + 1) + t;
                    int next = n + tubeSides + 1;
                    indices.Add(n); indices.Add(next); indices.Add(n + 1);
                    indices.Add(n + 1); indices.Add(next); indices.Add(next + 1);
                }
            var mesh = new Mesh { name = "TFM Original Ring - Preview Mesh" };
            mesh.SetVertices(vertices);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(indices, 0);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static void EnsureFolder(string path)
        {
            if (path == "Assets" || AssetDatabase.IsValidFolder(path)) return;
            string parent = path.Substring(0, path.LastIndexOf('/'));
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, path.Substring(path.LastIndexOf('/') + 1));
        }
    }
}
#endif
