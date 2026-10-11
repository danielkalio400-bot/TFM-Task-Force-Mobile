#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using TFM.Gameplay.Combat;
using TFM.Gameplay.Prototype;
using TFM.Player.Movement;
using TFM.World;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.Rendering;

namespace TFM.Editor
{
    /// <summary>
    /// Builds an ORIGINAL saved urban-industrial district from the user's
    /// already textured and animated operator. The Training Yard is NEVER
    /// overwritten. Geometry has usable lighting, physically based surfaces,
    /// static colliders, walkable streets and human-character patrols.
    /// </summary>
    public static class TFMDistrictWorldBuilder
    {
        public const string DistrictScene = "Assets/_TFM/Scenes/TFMDistrict01.unity";
        private const string AssetRoot = "Assets/_TFM/Worlds/District01";
        private const string Textures = AssetRoot + "/Textures";
        private const string Materials = AssetRoot + "/Materials";
        private static readonly Dictionary<string, Material> Palette =
            new Dictionary<string, Material>(StringComparer.Ordinal);

        [MenuItem("TFM/Worlds/Create District 01")]
        public static void CreateDistrict()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Exit Play Mode before creating a world.");
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;

            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(DistrictScene) != null)
            {
                EditorSceneManager.OpenScene(DistrictScene, OpenSceneMode.Single);
                Debug.Log("TFM District 01 already exists. Opened your authored scene WITHOUT overwriting it.");
                return;
            }

            if (AssetDatabase.LoadMainAssetAtPath(DistrictScene) != null ||
                File.Exists(DistrictScene))
                throw new InvalidOperationException(
                    "A conflicting District 01 scene file exists. Never overwrite authored work.");

            TFMTrainingSceneBuilder.EnsureScene();
            Scene source = EditorSceneManager.OpenScene(
                TFMTrainingSceneBuilder.ScenePath, OpenSceneMode.Single);
            TFMThirdPersonMotor[] sourcePlayers = Find<TFMThirdPersonMotor>(source);
            TFMTargetDummy[] sourceTargets = Find<TFMTargetDummy>(source);
            if (sourcePlayers.Length != 1 || sourceTargets.Length != 3)
                throw new InvalidOperationException(
                    "Cannot migrate gameplay: expected one real TFM player and three target anchors.");

            Transform playerVisual =
                sourcePlayers[0].transform.Find("TFM Production Operator");
            if (playerVisual == null ||
                playerVisual.GetComponentsInChildren<SkinnedMeshRenderer>(true).Length == 0)
                throw new InvalidOperationException(
                    "Install your textured TFM humanoid operator in Training Yard first.");
            Animator[] liveAnimators = playerVisual.GetComponentsInChildren<Animator>(true)
                .Where(a => a.avatar != null && a.avatar.isValid && a.avatar.isHuman &&
                    a.runtimeAnimatorController != null).ToArray();
            if (liveAnimators.Length != 1)
                throw new InvalidOperationException(
                    "Player operator needs the working Idle / Walk / Run controller first.");

            if (!EditorSceneManager.SaveScene(source, DistrictScene, true))
                throw new InvalidOperationException("Failed to save a separate District 01 scene.");
            Scene district = EditorSceneManager.OpenScene(DistrictScene, OpenSceneMode.Single);
            TFMThirdPersonMotor player = Find<TFMThirdPersonMotor>(district).Single();
            TFMTargetDummy[] targets = Find<TFMTargetDummy>(district);
            Transform hero = player.transform.Find("TFM Production Operator");
            TFMPrototypeBootstrap bootstrap = Find<TFMPrototypeBootstrap>(district).Single();
            if (bootstrap.GetComponent<TFMWorldIdentity>() == null)
                bootstrap.gameObject.AddComponent<TFMWorldIdentity>();

            Transform arena = Find<Transform>(district).FirstOrDefault(x => x.name == "Training Yard");
            if (arena == null)
                throw new InvalidOperationException("The copied gameplay scene has no environment root.");

            // Remove only copies of the old training-yard geometry.
            var oldWorld = arena.Cast<Transform>()
                .Where(x => x.GetComponent<TFMTargetDummy>() == null).ToArray();
            foreach (Transform originalBlock in oldWorld)
                UnityEngine.Object.DestroyImmediate(originalBlock.gameObject);

            EnsureFolder(AssetRoot);
            EnsureFolder(Textures);
            EnsureFolder(Materials);
            PreparePalette();

            var districtRoot = new GameObject("TFM District 01 - Industrial Quarter");
            districtRoot.transform.SetParent(arena, false);
            BuildStreetNetwork(districtRoot.transform);
            BuildIndustrialBlocks(districtRoot.transform);
            BuildStreetFurniture(districtRoot.transform);
            BuildPerimeter(districtRoot.transform);
            BuildCharacterPatrols(hero, targets, arena);
            EnsureDistrictLighting(districtRoot.transform);

            // Actual production district scene is added as a committed play scene.
            EditorBuildSettingsScene[] scenes = EditorBuildSettings.scenes;
            if (!scenes.Any(s => s.path == DistrictScene))
                EditorBuildSettings.scenes = new[]
                {
                    new EditorBuildSettingsScene(DistrictScene, true)
                }.Concat(scenes).ToArray();

            if (!EditorSceneManager.SaveScene(district))
                throw new InvalidOperationException("Unity could not save District 01.");
            AssetDatabase.SaveAssets();
            Debug.Log("TFM District 01 SAVED: " + DistrictScene +
                ". Includes your textured/animated Humanoid plus 3 cloned physical character patrols, " +
                "urban roads, industrial buildings, masonry facades, fences, vehicles, cover, " +
                "lighting and optimized tiling URP surfaces. Existing Training Yard was not changed.");
        }

        [MenuItem("TFM/Worlds/Open District 01")]
        public static void OpenDistrict()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) return;
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(DistrictScene) == null)
                throw new InvalidOperationException(
                    "Build the scene first using TFM > Worlds > Create District 01.");
            EditorSceneManager.OpenScene(DistrictScene, OpenSceneMode.Single);
        }

        private static void BuildStreetNetwork(Transform root)
        {
            var streets = Container(root, "Street Grid");
            Block(streets, "Asphalt Base", Vector3.down * 0.16f,
                new Vector3(120f, 0.30f, 120f), "asphalt", true);
            Block(streets, "Industrial Central Road", new Vector3(0f, 0.012f, 0f),
                new Vector3(15.6f, 0.024f, 118f), "road", false);
            Block(streets, "Cross Road", new Vector3(0f, 0.014f, 24f),
                new Vector3(118f, 0.024f, 10f), "road", false);

            for (int side = -1; side <= 1; side += 2)
            {
                Block(streets, side < 0 ? "West Stone Pavement" : "East Stone Pavement",
                    new Vector3(side * 10f, 0.095f, 0f),
                    new Vector3(4f, 0.18f, 118f), "concrete", true);
                Block(streets, "Sidewalk Curb " + side,
                    new Vector3(side * 7.85f, 0.18f, 0f),
                    new Vector3(0.22f, 0.14f, 118f), "trim", true);
                for (int i = -5; i <= 5; i++)
                {
                    Block(streets, "Road Zebra Marking " + side + " " + i,
                        new Vector3(side * 3.4f, 0.036f, i * 9.2f),
                        new Vector3(0.20f, 0.02f, 3.3f), "line", false);
                }
            }
            for (int i = -1; i <= 1; i++)
                for (int p = -5; p <= 5; p++)
                {
                    Block(streets, "Crosswalk " + i + " " + p,
                        new Vector3(i * 1.7f, 0.05f, 24f + p * 0.72f),
                        new Vector3(1.18f, 0.018f, 0.40f), "line", false);
                }
            for (int z = -45; z <= 45; z += 15)
                Block(streets, "Service Hatch " + z,
                    new Vector3(-5.8f, 0.04f, z), new Vector3(0.85f, 0.03f, 1.15f),
                    "metal", false);
        }

        private static void BuildIndustrialBlocks(Transform root)
        {
            var blocks = Container(root, "Original Modular Urban Buildings");
            for (int side = -1; side <= 1; side += 2)
            {
                for (int i = 0; i < 6; i++)
                {
                    int index = i + (side + 1) * 3;
                    float z = -47f + i * 19f;
                    float height = 10f + (i % 3) * 3.2f;
                    float width = 15f + (i % 2) * 2.2f;
                    float depth = 14f;
                    Transform building = Container(blocks,
                        (side < 0 ? "West" : "East") + " Building " + (i + 1));
                    float x = side * 24.4f;
                    Block(building, "Load-Bearing Concrete", new Vector3(x, height * 0.5f, z),
                        new Vector3(width, height, depth), (i % 3 == 0) ? "brick" : "concrete", true);
                    Block(building, "Roof Rim", new Vector3(x, height + 0.25f, z),
                        new Vector3(width + 1f, 0.5f, depth + 1f), "trim", false);
                    Block(building, "Roof Utility Block",
                        new Vector3(x - 2.0f, height + 0.95f, z - 2.0f),
                        new Vector3(3.5f, 1.45f, 3.3f), "metal", false);

                    // Street frontage has repeating bays, recessed dark windows,
                    // sills and vertical structural ribs (not a single bare cube).
                    float frontX = x - side * (width * 0.5f + 0.055f);
                    int floors = Mathf.FloorToInt((height - 1.5f) / 3.0f);
                    for (int level = 0; level < floors; level++)
                    {
                        float y = 2.0f + level * 3.05f;
                        for (int bay = -2; bay <= 2; bay++)
                        {
                            float bz = z + bay * 2.3f;
                            Block(building, "Glass Bay " + level + " " + bay,
                                new Vector3(frontX, y, bz),
                                new Vector3(0.08f, 1.65f, 1.4f), "glass", false);
                            Block(building, "Window Sill " + level + " " + bay,
                                new Vector3(frontX - side * 0.10f, y - 0.87f, bz),
                                new Vector3(0.26f, 0.13f, 1.65f), "trim", false);
                            Block(building, "Window Mullion " + level + " " + bay,
                                new Vector3(frontX - side * 0.10f, y, bz),
                                new Vector3(0.17f, 1.6f, 0.10f), "metal", false);
                        }
                        Block(building, "Floor Band " + level,
                            new Vector3(frontX - side * 0.14f, y + 1.1f, z),
                            new Vector3(0.35f, 0.22f, depth + 0.5f), "trim", false);
                    }

                    Block(building, "Warehouse Loading Door",
                        new Vector3(frontX - side * 0.20f, 1.7f, z + 3.1f),
                        new Vector3(0.15f, 3.3f, 3.3f), "metal", false);
                    Block(building, "Loading Door Lintel",
                        new Vector3(frontX - side * 0.35f, 3.42f, z + 3.1f),
                        new Vector3(0.25f, 0.22f, 3.7f), "trim", false);
                    Block(building, "Service Pipe",
                        new Vector3(frontX - side * 0.32f, height * 0.42f, z - 6f),
                        new Vector3(0.23f, height * 0.85f, 0.23f), "metal", false);
                    Block(building, "Emergency Stair Landing",
                        new Vector3(x + side * 1.9f, height + 0.45f, z + 3f),
                        new Vector3(3.2f, 0.22f, 3f), "metal", false);
                    if (index % 2 == 0)
                    {
                        // Wall signage is original and implemented as colored physical panels.
                        Block(building, "Illuminated District Sign",
                            new Vector3(frontX - side * 0.25f, 4.75f, z - 3.5f),
                            new Vector3(0.15f, 0.75f, 3.1f), "signal", false);
                    }
                }
            }
        }

        private static void BuildStreetFurniture(Transform root)
        {
            var objects = Container(root, "Cover Props, Services and Street Details");
            for (int side = -1; side <= 1; side += 2)
            {
                for (int i = -5; i <= 5; i++)
                {
                    if (i == 3) continue;
                    float z = i * 10.1f;
                    float x = side * 11.6f;
                    Block(objects, "Streetlight Post " + side + " " + i,
                        new Vector3(x, 2.8f, z),
                        new Vector3(0.16f, 5.6f, 0.16f), "metal", true);
                    Block(objects, "Streetlight Bracket " + side + " " + i,
                        new Vector3(x - side * 1.0f, 5.45f, z),
                        new Vector3(2.2f, 0.16f, 0.18f), "metal", false);
                    Block(objects, "Streetlight Emissive " + side + " " + i,
                        new Vector3(x - side * 2.03f, 5.32f, z),
                        new Vector3(0.65f, 0.10f, 0.52f), "light", false);
                }
            }

            for (int index = 0; index < 14; index++)
            {
                int side = index % 2 == 0 ? -1 : 1;
                float x = side * (11.5f + (index % 4) * 1.0f);
                float z = -50f + index * 7.8f;
                Block(objects, "Reinforced Cover Base " + index,
                    new Vector3(x, 0.55f, z),
                    new Vector3(2.6f, 1.10f, 1.15f),
                    index % 3 == 0 ? "metal" : "concrete", true);
                Block(objects, "Cover Cap " + index,
                    new Vector3(x, 1.13f, z),
                    new Vector3(2.9f, 0.12f, 1.32f), "trim", false);
            }

            // Original shipping modules; colliders create meaningful lanes of cover.
            for (int i = 0; i < 7; i++)
            {
                float x = (i % 2 == 0 ? -1 : 1) * 15.0f;
                float z = -41.5f + i * 14.4f;
                Transform module = Container(objects, "Freight Module " + i);
                Block(module, "Corrugated Steel Shell",
                    new Vector3(x, 1.3f, z), new Vector3(2.5f, 2.6f, 6.1f),
                    i % 2 == 0 ? "cargo" : "metal", true);
                for (int r = -2; r <= 2; r++)
                    Block(module, "Cargo Wall Rib " + r,
                        new Vector3(x + 1.30f, 1.3f, z + r * 1.05f),
                        new Vector3(0.07f, 2.45f, 0.10f), "trim", false);
                Block(module, "Freight Roof Ridge",
                    new Vector3(x, 2.65f, z), new Vector3(2.6f, 0.10f, 6.25f),
                    "trim", false);
            }

            // Simple original abandoned service-vehicle silhouettes with collision.
            for (int v = 0; v < 4; v++)
            {
                int side = v % 2 == 0 ? -1 : 1;
                float x = side * 6.2f;
                float z = -38f + v * 23.0f;
                Transform vehicle = Container(objects, "Parked Maintenance Vehicle " + v);
                Block(vehicle, "Underbody",
                    new Vector3(x, 0.8f, z), new Vector3(2.05f, 1.25f, 3.8f),
                    "metal", true);
                Block(vehicle, "Cab",
                    new Vector3(x, 1.72f, z - 0.6f), new Vector3(1.9f, 0.9f, 1.55f),
                    "glass", false);
                for (int sx = -1; sx <= 1; sx += 2)
                    for (int sz = -1; sz <= 1; sz += 2)
                    {
                        GameObject wheel = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                        wheel.name = "Wheel";
                        wheel.transform.SetParent(vehicle, false);
                        wheel.transform.localPosition =
                            new Vector3(x + sx * 1.06f, 0.45f, z + sz * 1.15f);
                        wheel.transform.localRotation = Quaternion.Euler(0f, 0f, 90f);
                        wheel.transform.localScale = new Vector3(0.42f, 0.12f, 0.42f);
                        wheel.GetComponent<Renderer>().sharedMaterial = Mat("rubber");
                        UnityEngine.Object.DestroyImmediate(wheel.GetComponent<Collider>());
                        wheel.isStatic = true;
                    }
            }
        }

        private static void BuildPerimeter(Transform root)
        {
            var perimeter = Container(root, "District Perimeter and Service Fences");
            for (int i = -5; i <= 5; i++)
            {
                float x = i * 10f;
                Block(perimeter, "North Barrier " + i,
                    new Vector3(x, 1.3f, 59f), new Vector3(9.7f, 2.6f, 0.7f), "brick", true);
                Block(perimeter, "South Barrier " + i,
                    new Vector3(x, 1.3f, -59f), new Vector3(9.7f, 2.6f, 0.7f), "brick", true);
            }
            for (int i = -5; i <= 5; i++)
            {
                float z = i * 10f;
                for (int side = -1; side <= 1; side += 2)
                {
                    Block(perimeter, "Service Fence Post " + side + " " + i,
                        new Vector3(side * 58f, 1.6f, z),
                        new Vector3(0.25f, 3.2f, 0.25f), "metal", true);
                    Block(perimeter, "Service Fence Panel " + side + " " + i,
                        new Vector3(side * 58f, 1.6f, z + 4.8f),
                        new Vector3(0.14f, 2.8f, 9.4f), "fence", true);
                }
            }
        }

        private static void BuildCharacterPatrols(Transform hero, TFMTargetDummy[] targets,
            Transform arena)
        {
            Vector3[] positions =
            {
                new Vector3(-4.8f, 0f, 11f),
                new Vector3(4.9f, 0f, 22f),
                new Vector3(-4.6f, 0f, 40f)
            };
            for (int i = 0; i < targets.Length; i++)
            {
                TFMTargetDummy target = targets[i];
                target.name = "District Patrol Unit " + (i + 1);
                target.transform.localPosition = positions[i];

                // Retain TFMTargetDummy anchor and its gameplay hit/respawn code.
                foreach (Transform child in target.transform.Cast<Transform>().ToArray())
                {
                    if (child.name == "Body" || child.name == "Head" ||
                        child.name == "TFM Production Practice Target")
                        UnityEngine.Object.DestroyImmediate(child.gameObject);
                }

                GameObject visual = UnityEngine.Object.Instantiate(
                    hero.gameObject, target.transform, false);
                visual.name = "TFM District Humanoid";
                visual.transform.localPosition = Vector3.zero;
                visual.transform.localRotation = Quaternion.identity;
                visual.transform.localScale = hero.localScale;

                // The cloned protagonist shares artwork/controller but must not
                // carry the protagonist's motor binding or view cosmetics.
                foreach (TFMOperatorMotionBridge bridge in
                    visual.GetComponentsInChildren<TFMOperatorMotionBridge>(true))
                    UnityEngine.Object.DestroyImmediate(bridge);
                Transform aura = visual.transform.Find("TFM Original Energy Preview");
                if (aura != null) UnityEngine.Object.DestroyImmediate(aura.gameObject);

                foreach (Transform child in
                    visual.GetComponentsInChildren<Transform>(true))
                    child.gameObject.layer = 0;
                foreach (Collider collider in visual.GetComponentsInChildren<Collider>(true))
                    UnityEngine.Object.DestroyImmediate(collider);

                // One physical target collider on the active Humanoid, no hidden
                // cube/sphere silhouettes and no self-shot ignore-raycast layer.
                CapsuleCollider hitbox = target.gameObject.AddComponent<CapsuleCollider>();
                hitbox.center = new Vector3(0f, 0.90f, 0f);
                hitbox.height = 1.8f;
                hitbox.radius = 0.36f;

                TFMDistrictPatrol patrol = target.gameObject.AddComponent<TFMDistrictPatrol>();
                Vector3 center = positions[i];
                patrol.Configure(center + Vector3.left * 1.5f,
                    center + Vector3.right * 1.5f, 1.55f + i * 0.12f);
            }
        }

        private static void EnsureDistrictLighting(Transform root)
        {
            // The copied player scene already contains its one directional sun.
            // Reuse existing lighting, avoiding expensive per-lamp realtime lights.
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.52f, 0.63f, 0.75f);
            RenderSettings.ambientEquatorColor = new Color(0.38f, 0.44f, 0.48f);
            RenderSettings.ambientGroundColor = new Color(0.19f, 0.22f, 0.24f);
        }

        private static Transform Container(Transform parent, string name)
        {
            GameObject folder = new GameObject(name);
            folder.transform.SetParent(parent, false);
            return folder.transform;
        }

        private static GameObject Block(Transform parent, string name,
            Vector3 position, Vector3 scale, string surface, bool solid)
        {
            GameObject block = GameObject.CreatePrimitive(PrimitiveType.Cube);
            block.name = name;
            block.transform.SetParent(parent, false);
            block.transform.localPosition = position;
            block.transform.localScale = scale;
            block.GetComponent<MeshRenderer>().sharedMaterial = Mat(surface);
            if (!solid)
                UnityEngine.Object.DestroyImmediate(block.GetComponent<Collider>());
            block.isStatic = true;
            return block;
        }

        private static Material Mat(string key)
        {
            if (Palette.TryGetValue(key, out Material value)) return value;
            throw new InvalidOperationException("Missing authored TFM material: " + key);
        }

        private static void PreparePalette()
        {
            Palette.Clear();
            Add("asphalt", new Color(0.16f, 0.18f, 0.20f), 0.0f, 0.12f, 5);
            Add("road", new Color(0.12f, 0.13f, 0.15f), 0.0f, 0.10f, 5);
            Add("concrete", new Color(0.52f, 0.53f, 0.50f), 0.02f, 0.16f, 11);
            Add("brick", new Color(0.46f, 0.26f, 0.21f), 0.0f, 0.10f, 17);
            Add("metal", new Color(0.32f, 0.38f, 0.42f), 0.70f, 0.38f, 7);
            Add("cargo", new Color(0.22f, 0.36f, 0.42f), 0.63f, 0.34f, 9);
            Add("glass", new Color(0.08f, 0.19f, 0.24f), 0.52f, 0.85f, 13);
            Add("trim", new Color(0.23f, 0.26f, 0.29f), 0.44f, 0.3f, 7);
            Add("line", new Color(0.83f, 0.77f, 0.57f), 0.02f, 0.18f, 3);
            Add("signal", new Color(0.05f, 0.46f, 0.57f), 0.28f, 0.84f, 23);
            Add("light", new Color(0.90f, 0.86f, 0.71f), 0.02f, 0.72f, 3);
            Add("fence", new Color(0.28f, 0.33f, 0.35f), 0.55f, 0.36f, 19);
            Add("rubber", new Color(0.035f, 0.040f, 0.046f), 0.02f, 0.12f, 3);
        }

        private static void Add(string key, Color tone, float metal,
            float smooth, int pattern)
        {
            string texturePath = Textures + "/TFM-" + key + ".png";
            if (AssetDatabase.LoadAssetAtPath<Texture2D>(texturePath) == null)
            {
                const int size = 256;
                Texture2D texture = new Texture2D(size, size, TextureFormat.RGBA32,
                    false, false);
                texture.name = "TFM Original " + key + " surface";
                texture.wrapMode = TextureWrapMode.Repeat;
                Color[] pixels = new Color[size * size];
                for (int y = 0; y < size; y++)
                {
                    for (int x = 0; x < size; x++)
                    {
                        // Deterministic variation and surface-specific masonry,
                        // coarse asphalt, corrugation, or glass divisions.
                        float noise = Mathf.PerlinNoise((x + pattern * 17) * 0.08f,
                            (y + pattern * 13) * 0.08f);
                        float grains = Mathf.PerlinNoise((x + pattern * 31) * 0.45f,
                            (y + pattern * 43) * 0.45f);
                        float shade = 0.76f + 0.30f * noise + 0.13f * grains;
                        if (key == "brick")
                        {
                            int row = y / 28;
                            int shift = row % 2 == 0 ? 0 : 24;
                            int bx = (x + shift) % 48;
                            if (y % 28 < 3 || bx < 3) shade *= 0.52f;
                        }
                        else if (key == "concrete")
                        {
                            if (x % 128 < 2 || y % 128 < 2) shade *= 0.7f;
                        }
                        else if (key == "metal" || key == "cargo" || key == "fence")
                        {
                            if (x % 28 < 3) shade *= 0.75f;
                        }
                        else if (key == "glass")
                        {
                            if (x % 64 < 3 || y % 82 < 3) shade *= 0.55f;
                        }
                        pixels[y * size + x] = new Color(
                            Mathf.Clamp01(tone.r * shade),
                            Mathf.Clamp01(tone.g * shade),
                            Mathf.Clamp01(tone.b * shade), 1f);
                    }
                }
                texture.SetPixels(pixels);
                texture.Apply();
                File.WriteAllBytes(texturePath, texture.EncodeToPNG());
                UnityEngine.Object.DestroyImmediate(texture);
                AssetDatabase.ImportAsset(texturePath);
                TextureImporter importer =
                    AssetImporter.GetAtPath(texturePath) as TextureImporter;
                if (importer != null)
                {
                    importer.wrapMode = TextureWrapMode.Repeat;
                    importer.mipmapEnabled = true;
                    importer.textureCompression = TextureImporterCompression.Compressed;
                    importer.SaveAndReimport();
                }
            }

            string materialPath = Materials + "/TFM-" + key + ".mat";
            Material material = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
            if (material == null)
            {
                Shader urp = Shader.Find("Universal Render Pipeline/Lit");
                if (urp == null)
                    throw new InvalidOperationException("Install Unity 6 URP/Lit before generating District 01.");
                material = new Material(urp) { name = "TFM Original " + key };
                material.SetColor("_BaseColor", Color.white);
                material.SetTexture("_BaseMap",
                    AssetDatabase.LoadAssetAtPath<Texture2D>(texturePath));
                material.SetFloat("_Metallic", metal);
                material.SetFloat("_Smoothness", smooth);
                if (key == "signal" || key == "light")
                {
                    material.EnableKeyword("_EMISSION");
                    material.SetColor("_EmissionColor",
                        key == "signal" ? new Color(0.04f, 1.3f, 1.7f) :
                            new Color(1.0f, 0.95f, 0.72f));
                }
                AssetDatabase.CreateAsset(material, materialPath);
            }
            Palette.Add(key, material);
        }

        private static void EnsureFolder(string path)
        {
            if (path == "Assets" || AssetDatabase.IsValidFolder(path)) return;
            string parent = path.Substring(0, path.LastIndexOf('/'));
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, path.Substring(path.LastIndexOf('/') + 1));
        }

        private static T[] Find<T>(Scene scene) where T : Component =>
            scene.GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<T>(true)).ToArray();
    }
}
#endif
