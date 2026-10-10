using TFM.Gameplay.Training;
using UnityEngine;

namespace TFM.Gameplay.Combat
{
    /// <summary>
    /// Local-only moving practice target. It never affects authoritative matches
    /// and never writes to a generated or locally authored Unity scene.
    /// </summary>
    [RequireComponent(typeof(TFMTargetDummy))]
    public sealed class TFMTargetMotion : MonoBehaviour
    {
        [SerializeField, Range(0f, 1.2f)] private float amplitudeMeters = 0.65f;
        [SerializeField, Range(0.05f, 0.8f)] private float cyclesPerSecond = 0.2f;
        [SerializeField] private float phaseRadians;

        private TFMTrainingTrial _trial;
        private Vector3 _origin;
        private float _startedAt;
        private bool _wasRunning;

        public void Configure(float amplitude, float frequency, float phase)
        {
            amplitudeMeters = Mathf.Clamp(amplitude, 0f, 1.2f);
            cyclesPerSecond = Mathf.Clamp(frequency, 0.05f, 0.8f);
            phaseRadians = phase;
        }

        private void Awake()
        {
            _origin = transform.localPosition;
            _trial = GetComponentInParent<TFMTrainingTrial>();
        }

        private void Update()
        {
            if (_trial == null) _trial = GetComponentInParent<TFMTrainingTrial>();
            bool running = _trial != null &&
                           _trial.Phase == TFMTrainingTrialPhase.Running;

            if (!running)
            {
                if (_wasRunning) transform.localPosition = _origin;
                _wasRunning = false;
                return;
            }

            if (!_wasRunning)
            {
                _startedAt = Time.time;
                _wasRunning = true;
            }

            float elapsed = Mathf.Max(0f, Time.time - _startedAt);
            float offset = Mathf.Sin(elapsed * Mathf.PI * 2f *
                                     cyclesPerSecond + phaseRadians) * amplitudeMeters;
            transform.localPosition = _origin + Vector3.right * offset;
        }

        private void OnDisable()
        {
            if (_wasRunning) transform.localPosition = _origin;
            _wasRunning = false;
        }
    }
}
