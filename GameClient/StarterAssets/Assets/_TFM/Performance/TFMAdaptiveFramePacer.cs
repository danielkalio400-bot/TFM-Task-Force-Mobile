using System;
using UnityEngine;

namespace TFM.Performance
{
    // Local presentation only. Match outcomes, server simulation and network
    // synchronization never depend on this client-reported performance value.
    [DefaultExecutionOrder(-850)]
    public sealed class TFMAdaptiveFramePacer : MonoBehaviour
    {
        private const int WindowFrames = 120;
        private const int CooldownWindows = 2;
        private const float SlowFrameAllowance = 0.12f;
        private const string ModeKey = "tfm.prototype.graphics.mode.v1";
        private const string CapKey = "tfm.prototype.graphics.cap.v1";

        [SerializeField] private TFMQualityMode mode = TFMQualityMode.Adaptive;
        [SerializeField, Range(0.65f, 1f)] private float minimumRenderScale = 0.75f;

        private int _refreshHz = 60;
        private int _targetHz = 30;
        private int _capHz;
        private int _frames;
        private int _slowFrames;
        private int _goodWindows;
        private int _cooldownWindows;
        private float _sumDelta;
        private float _renderScale = 1f;
        private int _previousTarget;
        private int _previousVSync;
        private bool _initialized;
        private bool _mobile;
        private string _deviceClass = "unknown";
        private TFMFramePacingSample _last = new TFMFramePacingSample();

        public TFMQualityMode Mode { get { return mode; } }
        public int DisplayRefreshHz { get { return _refreshHz; } }
        public int TargetFrameRate { get { return _targetHz; } }
        public int UserCapHz { get { return _capHz; } }
        public TFMFramePacingSample LastSample { get { return _last; } }

        private void OnEnable()
        {
            if (Application.isBatchMode) return;
            _previousTarget = Application.targetFrameRate;
            _previousVSync = QualitySettings.vSyncCount;
            _mobile = Application.isMobilePlatform;
            _deviceClass = _mobile ? "mobile" : "desktop";
            // Unity 6 reports the rational display refresh via refreshRateRatio.
            var refresh = Screen.currentResolution.refreshRateRatio;
            double hertz = refresh.value;
            _refreshHz = Mathf.Clamp(Mathf.RoundToInt((float)hertz), 30, 1000);
            if (double.IsNaN(hertz) || double.IsInfinity(hertz) || hertz < 30) _refreshHz = 60;
            mode = (TFMQualityMode)Mathf.Clamp(PlayerPrefs.GetInt(ModeKey, (int)mode), 0, 3);
            _capHz = Mathf.Clamp(PlayerPrefs.GetInt(CapKey, 0), 0, _refreshHz);
            QualitySettings.vSyncCount = 0;
            _initialized = true;
            ResetPolicy();
        }

        private void OnDisable()
        {
            if (!_initialized) return;
            ScalableBufferManager.ResizeBuffers(1f, 1f);
            Application.targetFrameRate = _previousTarget;
            QualitySettings.vSyncCount = _previousVSync;
            _initialized = false;
        }

        public void SetMode(TFMQualityMode next)
        {
            if (!Enum.IsDefined(typeof(TFMQualityMode), next)) return;
            mode = next;
            PlayerPrefs.SetInt(ModeKey, (int)mode);
            ResetPolicy();
        }

        // 0 = auto; positive values are user ceilings, always constrained by
        // the actual connected display and sustained device performance.
        public void SetFrameRateCap(int capHz)
        {
            _capHz = Mathf.Clamp(capHz, 0, _refreshHz);
            PlayerPrefs.SetInt(CapKey, _capHz);
            ResetPolicy();
        }

        private void ResetPolicy()
        {
            if (!_initialized) return;
            _targetHz = TFMFrameRatePolicy.ChooseInitial(_refreshHz, _mobile, mode, _capHz);
            _renderScale = 1f;
            _frames = _slowFrames = _goodWindows = _cooldownWindows = 0;
            _sumDelta = 0f;
            ScalableBufferManager.ResizeBuffers(1f, 1f);
            ApplyTarget();
        }

        private void ApplyTarget()
        {
            Application.targetFrameRate = _targetHz;
        }

        private void Update()
        {
            if (!_initialized) return;
            float delta = Time.unscaledDeltaTime;
            // Ignore pauses, app switching, zero deltas, and very long frames;
            // those cannot justify a quality decision.
            if (delta <= 0f || delta >= 0.25f) return;
            _frames++;
            _sumDelta += delta;
            if (delta > 1.25f / _targetHz) _slowFrames++;
            if (_frames < WindowFrames) return;

            float measured = _frames / _sumDelta;
            float slowFraction = (float)_slowFrames / _frames;
            bool good = measured >= _targetHz * 0.9f && slowFraction <= SlowFrameAllowance;
            _last = new TFMFramePacingSample
            {
                RequestedFrameRate = _targetHz,
                ObservedFrameRate = measured,
                AverageFrameMilliseconds = 1000f * _sumDelta / _frames,
                SlowFrameFraction = slowFraction,
                SampleCount = _frames,
                RenderScale = _renderScale,
                DeviceClass = _deviceClass,
                SustainedTargetMet = good
            };

            _frames = _slowFrames = 0;
            _sumDelta = 0f;
            if (_cooldownWindows > 0) { _cooldownWindows--; return; }
            if (mode != TFMQualityMode.Adaptive) return;

            if (!good)
            {
                _goodWindows = 0;
                // Prefer less rendering work before a new lower FPS cap.
                if (_renderScale > minimumRenderScale + 0.02f)
                {
                    _renderScale = Mathf.Max(minimumRenderScale, _renderScale - 0.1f);
                    ScalableBufferManager.ResizeBuffers(_renderScale, _renderScale);
                }
                else _targetHz = TFMFrameRatePolicy.NextLower(_refreshHz, _targetHz);
                ApplyTarget();
                _cooldownWindows = CooldownWindows;
            }
            else if (++_goodWindows >= 3)
            {
                _goodWindows = 0;
                int ceiling = TFMFrameRatePolicy.MaxPermitted(_refreshHz, mode, _capHz);
                // Controlled probing: meeting 30 FPS does NOT prove the
                // next tier is sustainable until that tier itself is measured.
                if (_renderScale < 0.99f)
                {
                    _renderScale = Mathf.Min(1f, _renderScale + 0.05f);
                    ScalableBufferManager.ResizeBuffers(_renderScale, _renderScale);
                }
                else
                {
                    _targetHz = TFMFrameRatePolicy.NextHigher(_refreshHz, _targetHz, ceiling);
                    ApplyTarget();
                }
                _cooldownWindows = CooldownWindows;
            }
        }
    }
}
