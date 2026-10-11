using System.Collections.Generic;
using TFM.Gameplay.Combat;
using TFM.Player.Camera;
using TFM.Player.Controls;
using TFM.Player.Movement;
using TFM.UI.HUD;
using TFM.Performance;
using TFM.Gameplay.Training;
using TFM.Gameplay.Practice;
using TFM.World;
using UnityEngine;

namespace TFM.Gameplay.Prototype
{
    [DefaultExecutionOrder(-1000)]
    public sealed class TFMPrototypeBootstrap : MonoBehaviour
    {
        private static readonly Vector3 SpawnPoint = new Vector3(0f, 0.05f, -7f);
        private readonly List<Material> _runtimeMaterials = new List<Material>();
        [SerializeField] private bool sceneBuilt;

        public bool SceneBuilt => sceneBuilt;
        public IReadOnlyList<Material> GeneratedMaterials => _runtimeMaterials;

        public void ReleaseGeneratedMaterialOwnership()
        {
            _runtimeMaterials.Clear();
        }

        private void Awake()
        {
            BuildScene();
            if (Application.isPlaying)
            {
                // Works with already-generated saved scenes: never overwrite
                // locally edited geometry just to install the new controller.
                if (GetComponent<TFMAdaptiveFramePacer>() == null)
                    gameObject.AddComponent<TFMAdaptiveFramePacer>();
                if (GetComponent<TFMPerformancePanel>() == null)
                    gameObject.AddComponent<TFMPerformancePanel>();

                // A production district scene uses character patrols and a full map,
                // not the Training Yard's target drills, waypoint cones or timers.
                if (GetComponent<TFMWorldIdentity>() != null) return;

                // Existing saved yards are extended at runtime in place.
                // Nothing regenerates or overwrites locally edited Unity scenes.
                TFMTrainingTrial trial = GetComponent<TFMTrainingTrial>();
                if (trial == null) trial = gameObject.AddComponent<TFMTrainingTrial>();
                trial.Configure(GetComponentInChildren<TFMHitscanWeapon>(),
                    GetComponentsInChildren<TFMTargetDummy>(true));
                TFMTrainingTrialHud trialHud = GetComponent<TFMTrainingTrialHud>();
                if (trialHud == null)
                    trialHud = gameObject.AddComponent<TFMTrainingTrialHud>();
                trialHud.Configure(trial);

                // Install an optional moving-target drill in memory only. Existing
                // authored scene assets and target positions remain untouched.
                TFMTargetDummy[] practiceTargets = GetComponentsInChildren<TFMTargetDummy>(true);
                for (int i = 0; i < practiceTargets.Length; i++)
                {
                    TFMTargetMotion motion = practiceTargets[i].GetComponent<TFMTargetMotion>();
                    if (motion != null) continue; // Respect authored motion settings.
                    motion = practiceTargets[i].gameObject.AddComponent<TFMTargetMotion>();
                    motion.Configure(0.65f, 0.18f + i * 0.045f, i * 1.7f);
                }

                TFMObjectiveRound course = GetComponent<TFMObjectiveRound>();
                if (course == null) course = gameObject.AddComponent<TFMObjectiveRound>();
                TFMObjectiveWaypoint[] markers =
                    GetComponentsInChildren<TFMObjectiveWaypoint>(true);
                if (markers.Length == 0)
                    markers = TFMObjectiveCourseBuilder.Build(transform);
                TFMThirdPersonMotor motor = GetComponentInChildren<TFMThirdPersonMotor>();
                course.Configure(motor != null ? motor.transform : null, trial, markers);
                TFMObjectiveRoundHud courseHud = GetComponent<TFMObjectiveRoundHud>();
                if (courseHud == null)
                    courseHud = gameObject.AddComponent<TFMObjectiveRoundHud>();
                courseHud.Configure(course);
            }
        }

        // Also called by the Editor builder. Serialized references keep the saved scene playable.
        public void BuildScene()
        {
            if (sceneBuilt) return;

            BuildTrainingYard();
            GameObject player = BuildPlayer();
            Camera sceneCamera = PrepareCamera();
            ConnectPlayerAndCamera(player, sceneCamera);
            PrepareLighting();

            TFMPrototypeHud hud = gameObject.AddComponent<TFMPrototypeHud>();
            hud.Configure(
                player.GetComponent<TFMPlayerInput>(),
                player.GetComponent<TFMHitscanWeapon>());

            sceneBuilt = true;
            Debug.Log("TFM 3D training yard ready.");
        }

        private void BuildTrainingYard()
        {
            GameObject arena = new GameObject("Training Yard");
            arena.transform.SetParent(transform, false);

            Material floor = CreateMaterial("Floor", new Color(0.16f, 0.19f, 0.22f));
            Material wall = CreateMaterial("Boundary", new Color(0.23f, 0.29f, 0.34f));
            Material cover = CreateMaterial("Cover", new Color(0.18f, 0.43f, 0.48f));
            Material accent = CreateMaterial("Accent", new Color(0.91f, 0.48f, 0.12f));
            Material target = CreateMaterial("Target", Color.white);

            CreateBlock(arena.transform, "Ground", new Vector3(0f, -0.5f, 0f), new Vector3(30f, 1f, 30f), floor);
            CreateBlock(arena.transform, "North Wall", new Vector3(0f, 1.5f, 15f), new Vector3(30f, 3f, 0.6f), wall);
            CreateBlock(arena.transform, "South Wall", new Vector3(0f, 1.5f, -15f), new Vector3(30f, 3f, 0.6f), wall);
            CreateBlock(arena.transform, "East Wall", new Vector3(15f, 1.5f, 0f), new Vector3(0.6f, 3f, 30f), wall);
            CreateBlock(arena.transform, "West Wall", new Vector3(-15f, 1.5f, 0f), new Vector3(0.6f, 3f, 30f), wall);

            CreateBlock(arena.transform, "Center Cover", new Vector3(0f, 1f, 2f), new Vector3(7f, 2f, 1.2f), cover);
            CreateBlock(arena.transform, "West Cover", new Vector3(-7f, 0.75f, -2f), new Vector3(3f, 1.5f, 1.2f), accent);
            CreateBlock(arena.transform, "East Cover", new Vector3(7f, 0.75f, 6f), new Vector3(3f, 1.5f, 1.2f), accent);
            CreateBlock(arena.transform, "North Platform", new Vector3(-6f, 1f, 10f), new Vector3(5f, 2f, 4f), cover);
            CreateBlock(arena.transform, "South Platform", new Vector3(7f, 0.6f, -9f), new Vector3(4f, 1.2f, 4f), cover);
            CreateBlock(arena.transform, "Center Marker", new Vector3(0f, 0.03f, 7f), new Vector3(3f, 0.06f, 3f), accent);

            CreateTarget(arena.transform, "West Target", new Vector3(-4f, 0f, -1f), target);
            CreateTarget(arena.transform, "Center Target", new Vector3(0f, 0f, -1f), target);
            CreateTarget(arena.transform, "East Target", new Vector3(4f, 0f, -1f), target);
        }

        private GameObject BuildPlayer()
        {
            GameObject player = new GameObject("TFM Player");
            player.transform.SetParent(transform, false);
            player.transform.position = SpawnPoint;
            player.layer = 2;

            CharacterController controller = player.AddComponent<CharacterController>();
            controller.center = new Vector3(0f, 0.9f, 0f);
            controller.height = 1.8f;
            controller.radius = 0.38f;
            controller.stepOffset = 0.3f;
            controller.slopeLimit = 50f;

            player.AddComponent<TFMPlayerInput>();
            player.AddComponent<TFMThirdPersonMotor>();
            player.AddComponent<TFMHitscanWeapon>();

            GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            visual.name = "Player Visual";
            visual.layer = 2;
            visual.transform.SetParent(player.transform, false);
            visual.transform.localPosition = new Vector3(0f, 0.9f, 0f);
            visual.transform.localScale = new Vector3(0.75f, 0.9f, 0.75f);
            visual.GetComponent<Renderer>().sharedMaterial =
                CreateMaterial("Player", new Color(0.14f, 0.62f, 0.78f));

            Collider primitiveCollider = visual.GetComponent<Collider>();
            primitiveCollider.enabled = false;
            if (Application.isPlaying) Destroy(primitiveCollider);

            return player;
        }

        private Camera PrepareCamera()
        {
            Camera sceneCamera = Application.isPlaying ? Camera.main : null;
            if (sceneCamera == null)
            {
                GameObject cameraObject = new GameObject("Main Camera");
                cameraObject.transform.SetParent(transform, false);
                cameraObject.tag = "MainCamera";
                sceneCamera = cameraObject.AddComponent<Camera>();
                cameraObject.AddComponent<AudioListener>();
            }

            sceneCamera.fieldOfView = 65f;
            sceneCamera.nearClipPlane = 0.1f;
            sceneCamera.farClipPlane = 250f;
            sceneCamera.clearFlags = CameraClearFlags.SolidColor;
            sceneCamera.backgroundColor = new Color(0.18f, 0.27f, 0.36f);
            return sceneCamera;
        }

        private static void ConnectPlayerAndCamera(GameObject player, Camera sceneCamera)
        {
            TFMPlayerInput input = player.GetComponent<TFMPlayerInput>();
            TFMThirdPersonMotor motor = player.GetComponent<TFMThirdPersonMotor>();
            TFMHitscanWeapon weapon = player.GetComponent<TFMHitscanWeapon>();
            TFMThirdPersonCamera cameraController = sceneCamera.GetComponent<TFMThirdPersonCamera>();
            if (cameraController == null)
            {
                cameraController = sceneCamera.gameObject.AddComponent<TFMThirdPersonCamera>();
            }

            motor.Configure(input, sceneCamera.transform);
            weapon.Configure(input, sceneCamera);
            cameraController.Configure(player.transform, input);
        }

        private static void CreateTarget(
            Transform parent,
            string targetName,
            Vector3 position,
            Material material)
        {
            GameObject target = new GameObject(targetName);
            target.transform.SetParent(parent, false);
            target.transform.localPosition = position;

            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Cube);
            body.name = "Body";
            body.transform.SetParent(target.transform, false);
            body.transform.localPosition = new Vector3(0f, 1.15f, 0f);
            body.transform.localScale = new Vector3(1.2f, 1.7f, 0.35f);
            body.GetComponent<Renderer>().sharedMaterial = material;

            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.name = "Head";
            head.transform.SetParent(target.transform, false);
            head.transform.localPosition = new Vector3(0f, 2.35f, 0f);
            head.transform.localScale = Vector3.one * 0.7f;
            head.GetComponent<Renderer>().sharedMaterial = material;

            target.AddComponent<TFMTargetDummy>();
        }

        private void PrepareLighting()
        {
            if (!Application.isPlaying || Object.FindFirstObjectByType<Light>() == null)
            {
                GameObject lightObject = new GameObject("Training Yard Sun");
                lightObject.transform.SetParent(transform, false);
                Light sun = lightObject.AddComponent<Light>();
                sun.type = LightType.Directional;
                sun.intensity = 1.1f;
                sun.color = new Color(1f, 0.94f, 0.84f);
                lightObject.transform.rotation = Quaternion.Euler(48f, -32f, 0f);
            }

            RenderSettings.ambientLight = new Color(0.42f, 0.47f, 0.55f);
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
        }

        private Material CreateMaterial(string materialName, Color color)
        {
            Shader shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null)
            {
                shader = Shader.Find("Standard");
            }
            if (shader == null)
            {
                return null;
            }

            Material material = new Material(shader)
            {
                name = $"TFM Prototype {materialName}",
                color = color
            };
            _runtimeMaterials.Add(material);
            return material;
        }

        private static GameObject CreateBlock(
            Transform parent,
            string blockName,
            Vector3 position,
            Vector3 scale,
            Material material)
        {
            GameObject block = GameObject.CreatePrimitive(PrimitiveType.Cube);
            block.name = blockName;
            block.transform.SetParent(parent, false);
            block.transform.localPosition = position;
            block.transform.localScale = scale;
            if (material != null)
            {
                block.GetComponent<Renderer>().sharedMaterial = material;
            }
            return block;
        }

        private void OnDestroy()
        {
            // Editor-generated materials become persistent assets, owned by AssetDatabase.
            if (!Application.isPlaying) return;
            foreach (Material material in _runtimeMaterials)
            {
                if (material != null)
                {
                    Destroy(material);
                }
            }
        }
    }
}
