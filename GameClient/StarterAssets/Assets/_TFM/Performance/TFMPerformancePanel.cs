#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using UnityEngine;

namespace TFM.Performance
{
    // Development UI. Replace IMGUI with production UI Toolkit/UGUI after
    // mobile touch target, safe area, remapping and accessibility QA.
    public sealed class TFMPerformancePanel : MonoBehaviour
    {
        private TFMAdaptiveFramePacer _pacer;
        private bool _expanded;
        private Vector2 _scroll;
        private void Awake() { _pacer = GetComponent<TFMAdaptiveFramePacer>(); }

        private void Update()
        {
            if (Application.isMobilePlatform) return;
#if ENABLE_INPUT_SYSTEM
            if (Keyboard.current != null && Keyboard.current.f8Key.wasPressedThisFrame)
                _expanded = !_expanded;
#elif ENABLE_LEGACY_INPUT_MANAGER
            if (Input.GetKeyDown(KeyCode.F8)) _expanded = !_expanded;
#endif
        }

        private void OnGUI()
        {
            if (_pacer == null || Application.isBatchMode) return;
            Rect safe = Screen.safeArea;
            float unit = Mathf.Clamp(safe.width / 1050f, 0.8f, 1.45f);
            Rect toggle = new Rect(safe.xMin + 12f, safe.yMax - 52f * unit, 154f * unit, 44f * unit);
            if (GUI.Button(toggle, _expanded ? "Close graphics" : "Graphics / FPS"))
                _expanded = !_expanded;
            if (!_expanded) return;

            float width = Mathf.Min(safe.width - 24f, 470f * unit);
            float height = Mathf.Min(safe.height - 80f * unit, 350f * unit);
            Rect panel = new Rect(safe.xMin + 12f, safe.yMax - height - 62f * unit, width, height);
            GUI.Box(panel, "TFM | Runtime performance");
            GUILayout.BeginArea(new Rect(panel.x + 15f, panel.y + 30f, panel.width - 30f, panel.height - 42f));
            _scroll = GUILayout.BeginScrollView(_scroll);
            GUILayout.Label("Display: " + _pacer.DisplayRefreshHz + " Hz | Target: " + _pacer.TargetFrameRate + " FPS");
            GUILayout.Label(_pacer.LastSample.ToString());
            GUILayout.Label("Frame cap: " + (_pacer.UserCapHz <= 0 ? "Automatic" : _pacer.UserCapHz + " FPS"));
            GUILayout.BeginHorizontal();
            foreach (TFMQualityMode choice in new[] {
                TFMQualityMode.BatterySaver, TFMQualityMode.Balanced,
                TFMQualityMode.Performance, TFMQualityMode.Adaptive
            })
            {
                if (GUILayout.Button(choice.ToString(), GUILayout.MinHeight(38f * unit)))
                    _pacer.SetMode(choice);
            }
            GUILayout.EndHorizontal();
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Auto cap", GUILayout.MinHeight(42f * unit)))
                _pacer.SetFrameRateCap(0);
            if (GUILayout.Button("30", GUILayout.MinHeight(42f * unit)))
                _pacer.SetFrameRateCap(30);
            if (GUILayout.Button("60", GUILayout.MinHeight(42f * unit)))
                _pacer.SetFrameRateCap(60);
            if (GUILayout.Button("Full display", GUILayout.MinHeight(42f * unit)))
                _pacer.SetFrameRateCap(_pacer.DisplayRefreshHz);
            GUILayout.EndHorizontal();
            GUILayout.Label("F8: toggle on PC. Caps are upper limits, not guaranteed frame rates.");
            GUILayout.Label("Performance data stays local to this prototype. Online match results are server-owned.");
            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }
    }
}
