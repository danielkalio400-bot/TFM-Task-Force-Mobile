#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using TFM.World;
using TFM.World.District01;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace TFM.Editor
{
    // Additive production scene authoring: never replaces the already-textured
    // District 01 scene, imported operator materials, animation, or local edits.
    public static class TFMDistrictLifeBuilder
    {
        private const string ScenePath = TFMDistrictWorldBuilder.DistrictScene;
        private const string ExpansionName = "TFM District 01 - Street Life Bulk 63";
        private const string Materials = "Assets/_TFM/Worlds/District01/Materials";
        [MenuItem("TFM/Worlds/Expand District 01 - Street Life")]
        public static void ExpandMenu()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Exit Play Mode before authoring.");
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            ExpandScene();
        }

        public static void ExpandBatch()
        {
            try
            {
                ExpandScene();
                Debug.Log("TFM_DISTRICT_LIFE_RESULT=SUCCESS");
                EditorApplication.Exit(0);
            }
            catch (Exception error)
            {
                Debug.LogException(error);
                Debug.LogError("TFM_DISTRICT_LIFE_RESULT=FAILED");
                EditorApplication.Exit(1);
            }
        }

        public static void ExpandScene()
        {
            if (!File.Exists(ScenePath))
                throw new InvalidOperationException("Build District 01 before Street Life.");
            Scene scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            if (!Find<TFMWorldIdentity>(scene).Any())
                throw new InvalidOperationException("District has no production world identity.");
            Transform root = Find<Transform>(scene).FirstOrDefault(
                t => t.name == "TFM District 01 - Industrial Quarter");
            if (root == null)
                throw new InvalidOperationException("Original District 01 geometry missing.");

            Transform existing = root.Cast<Transform>()
                .FirstOrDefault(x => x.name == ExpansionName);
            if (existing != null)
            {
                Debug.Log("TFM Street Life already authored. Preserved your scene unchanged.");
                return;
            }

            // Preflight shared original textures: the installed CC0 material
            // assets are reused rather than regenerated or replaced.
            string[] keys = { "metal", "rubber", "glass", "cargo", "concrete", "trim" };
            var palette = new Dictionary<string, Material>();
            foreach (string key in keys)
            {
                string p = Materials + "/TFM-" + key + ".mat";
                Material mat = AssetDatabase.LoadAssetAtPath<Material>(p);
                if (mat == null)
                    throw new InvalidOperationException("Original district material missing: " + p);
                palette.Add(key, mat);
            }
            palette.Add("leaves", EnsureNewMaterial("TFM-DistrictLeaf",
                new Color(0.16f, 0.36f, 0.19f), 0f, 0.12f));
            palette.Add("bark", EnsureNewMaterial("TFM-DistrictBark",
                new Color(0.34f, 0.23f, 0.17f), 0f, 0.16f));

            Transform expansion = Folder(root, ExpansionName);
            Transform street = Folder(expansion, "Moving Street Traffic");
            Transform greens = Folder(expansion, "Street Trees and Planters");
            Transform details = Folder(expansion, "Additional Industrial Details");

            var intersection = Folder(street, "Signalized Junction");
            TFMDistrictTrafficSignal signal =
                intersection.gameObject.AddComponent<TFMDistrictTrafficSignal>();
            var vertical = new List<Renderer>();
            var horizontal = new List<Renderer>();
            for (int index = 0; index < 4; index++)
            {
                bool verticalLane = index < 2;
                float x = verticalLane ? (index == 0 ? -8.4f : 8.4f) :
                    (index == 2 ? -8.5f : 8.5f);
                float z = verticalLane ? (index == 0 ? 16.5f : 31.5f) :
                    (index == 2 ? 18.4f : 29.5f);
                Transform lamp = Folder(intersection, "Functional Traffic Signal " + index);
                Part(lamp, "Steel Upright", new Vector3(x, 2.45f, z),
                    new Vector3(0.15f, 4.9f, 0.15f), palette["metal"], true);
                Renderer bulb = Part(lamp, "Signal Lamp", new Vector3(x, 4.65f, z),
                    new Vector3(0.64f, 0.64f, 0.32f),
                    palette["trim"], false).GetComponent<Renderer>();
                if (verticalLane) vertical.Add(bulb); else horizontal.Add(bulb);
            }
            signal.Configure(vertical.ToArray(), horizontal.ToArray());

            // Lane centre lines correspond to authored street geometry.
            // The southern side of the cross street is clear of the original
            // building footprint at z >= 22. Vehicle width is ~2 metres.
            CreateVehicle(street, "Eastbound Service Van", signal,
                new Vector3(-49f, 0f, 20.5f), new Vector3(49f, 0f, 20.5f),
                false, 4.4f, palette, 0);
            // A third N/S unit avoids routing cars through the i=4
            // industrial buildings intersecting the north crossing lane.
            CreateVehicle(street, "Northbound Courier Car", signal,
                new Vector3(-3.2f, 0f, -33f), new Vector3(-3.2f, 0f, 49f),
                true, 3.5f, palette, 1);
            CreateVehicle(street, "Northbound Logistics Van", signal,
                new Vector3(-3.2f, 0f, -49f), new Vector3(-3.2f, 0f, 49f),
                true, 3.9f, palette, 2);
            CreateVehicle(street, "Southbound Service Car", signal,
                new Vector3(3.2f, 0f, 49f), new Vector3(3.2f, 0f, -49f),
                true, 3.8f, palette, 3);

            for (int side = -1; side <= 1; side += 2)
                for (int i = 0; i < 11; i++)
                {
                    float z = -48f + i * 9.4f;
                    // Outside the roadway and the primary cover pieces.
                    float x = side * 13.8f;
                    Transform tree = Folder(greens, "District Canopy " + side + " " + i);
                    float tall = 3.2f + (i % 4) * 0.35f;
                    var trunk = Part(tree, "Physical Trunk",
                        new Vector3(x, tall * 0.5f, z),
                        new Vector3(0.28f, tall * 0.50f, 0.28f),
                        palette["bark"], true, PrimitiveType.Cylinder);
                    Part(tree, "Leaf Canopy",
                        new Vector3(x, tall + 0.52f, z),
                        new Vector3(2.1f, 1.6f, 2.1f),
                        palette["leaves"], false, PrimitiveType.Sphere);
                    for (int layer = -1; layer <= 1; layer += 2)
                        Part(tree, "Bough " + layer,
                            new Vector3(x + layer * 0.7f, tall + 0.1f, z),
                            new Vector3(1.4f, 1.0f, 1.55f),
                            palette["leaves"], false, PrimitiveType.Sphere);
                }
            for (int i = 0; i < 12; i++)
            {
                float x = i % 2 == 0 ? -16f : 16f;
                float z = -47f + i * 8.4f;
                Transform unit = Folder(details, "Utility Cabinet " + i);
                Part(unit, "Service Housing",
                    new Vector3(x, 0.9f, z),
                    new Vector3(1.1f, 1.8f, 0.75f), palette["metal"], true);
                Part(unit, "Front Service Door",
                    new Vector3(x, 0.95f, z + 0.40f),
                    new Vector3(0.88f, 1.35f, 0.07f), palette["trim"], false);
                Part(unit, "Conduit",
                    new Vector3(x + 0.40f, 2.2f, z),
                    new Vector3(0.08f, 0.8f, 0.12f), palette["metal"], false);
            }

            Light sunlight = Find<Light>(scene).FirstOrDefault(
                l => l.type == LightType.Directional);
            if (sunlight != null)
                expansion.gameObject.AddComponent<TFMDistrictDaylight>().Configure(sunlight);

            EditorSceneManager.MarkSceneDirty(scene);
            if (!EditorSceneManager.SaveScene(scene))
                throw new InvalidOperationException("Unable to save expanded district.");
            AssetDatabase.SaveAssets();
            Debug.Log("TFM District 01 expanded: live signal phases, four road vehicles, " +
                "22 roadside trees, 12 utility cabinets and dynamic daylight.");
        }

        private static void CreateVehicle(Transform root, string name,
            TFMDistrictTrafficSignal junction, Vector3 origin, Vector3 end,
            bool vertical, float speed, Dictionary<string, Material> palette, int variation)
        {
            Transform car = Folder(root, name);
            car.position = origin;
            var collider = car.gameObject.AddComponent<BoxCollider>();
            collider.center = new Vector3(0f, 0.91f, 0f);
            collider.size = new Vector3(2.0f, 1.65f, 4.0f);
            // Parent and descendants share vehicle-forward (local +Z).
            Part(car, "Lower Vehicle Body",new Vector3(0f,0.77f,0f),
                new Vector3(1.98f,1.08f,4.0f),
                variation % 2 == 0 ? palette["cargo"] : palette["metal"], false);
            Part(car, "Passenger Cabin",new Vector3(0f,1.48f,-0.4f),
                new Vector3(1.79f,0.83f,1.85f),palette["glass"],false);
            Part(car, "Front Bumper",new Vector3(0f,0.49f,2.02f),
                new Vector3(1.94f,0.22f,0.20f),palette["trim"],false);
            Part(car, "Rear Bumper",new Vector3(0f,0.49f,-2.02f),
                new Vector3(1.94f,0.22f,0.20f),palette["trim"],false);
            for (int side=-1;side<=1;side+=2)
                for (int axle=-1;axle<=1;axle+=2)
                {
                    GameObject wheel = Part(car, "Rubber Wheel",
                        new Vector3(side*1.05f,0.46f,axle*1.27f),
                        new Vector3(0.43f,0.13f,0.43f),
                        palette["rubber"],false,PrimitiveType.Cylinder);
                    wheel.transform.localRotation=Quaternion.Euler(0f,0f,90f);
                }
            car.gameObject.AddComponent<TFMDistrictStreetVehicle>().Configure(
                junction, origin, end, vertical, speed);
        }

        private static Material EnsureNewMaterial(string name, Color color,
            float metal, float smooth)
        {
            string path = Materials + "/" + name + ".mat";
            Material existing = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (existing != null) return existing;
            if (AssetDatabase.LoadMainAssetAtPath(path) != null)
                throw new InvalidOperationException("Refusing to replace asset " + path);
            Shader shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) throw new InvalidOperationException("Unity URP/Lit required.");
            Material material = new Material(shader) { name = name };
            material.SetColor("_BaseColor", color);
            material.SetFloat("_Metallic", metal);
            material.SetFloat("_Smoothness", smooth);
            AssetDatabase.CreateAsset(material, path);
            return material;
        }

        private static GameObject Part(Transform root, string name,
            Vector3 pos, Vector3 scale, Material mat, bool physical,
            PrimitiveType type = PrimitiveType.Cube)
        {
            GameObject obj = GameObject.CreatePrimitive(type);
            obj.name = name;
            obj.transform.SetParent(root, false);
            obj.transform.localPosition = pos;
            obj.transform.localScale = scale;
            obj.GetComponent<Renderer>().sharedMaterial = mat;
            if (!physical) UnityEngine.Object.DestroyImmediate(obj.GetComponent<Collider>());
            obj.isStatic = physical;
            return obj;
        }

        private static Transform Folder(Transform parent, string name)
        {
            var item = new GameObject(name);
            item.transform.SetParent(parent, false);
            return item.transform;
        }

        private static T[] Find<T>(Scene scene) where T : Component =>
            scene.GetRootGameObjects()
                .SelectMany(x => x.GetComponentsInChildren<T>(true)).ToArray();
    }
}
#endif
