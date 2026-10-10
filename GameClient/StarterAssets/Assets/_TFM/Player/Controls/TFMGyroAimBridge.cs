#if ENABLE_INPUT_SYSTEM
using InputSystemGyroscope = UnityEngine.InputSystem.Gyroscope;
using UnityEngine.InputSystem;
#endif
using UnityEngine;

namespace TFM.Player.Controls
{
    public sealed class TFMGyroAimBridge : MonoBehaviour
    {
        [SerializeField] private bool gyroEnabled = true;
        [SerializeField, Range(0.1f, 8f)] private float sensitivity = 1.8f;
        [SerializeField, Range(0f, 0.5f)] private float deadZone = 0.03f;
        [SerializeField, Range(0.01f, 1f)] private float smoothing = 0.25f;

        private Vector2 _filtered;

        public Vector2 LookDelta { get; private set; }
        public bool IsAvailable { get; private set; }

        private void OnEnable()
        {
#if ENABLE_INPUT_SYSTEM
            InputSystemGyroscope sensor = InputSystemGyroscope.current;
            if (sensor != null)
            {
                InputSystem.EnableDevice(sensor);
                IsAvailable = true;
            }
#elif ENABLE_LEGACY_INPUT_MANAGER
            if (SystemInfo.supportsGyroscope)
            {
                Input.gyro.enabled = true;
                IsAvailable = true;
            }
#endif
        }

        private void Update()
        {
            LookDelta = Vector2.zero;
            if (!gyroEnabled || !IsAvailable)
            {
                return;
            }

            Vector3 angularVelocity = Vector3.zero;
#if ENABLE_INPUT_SYSTEM
            InputSystemGyroscope sensor = InputSystemGyroscope.current;
            if (sensor != null)
            {
                angularVelocity = sensor.angularVelocity.ReadValue();
            }
#elif ENABLE_LEGACY_INPUT_MANAGER
            angularVelocity = Input.gyro.rotationRateUnbiased;
#endif

            Vector2 raw = new Vector2(-angularVelocity.x, angularVelocity.y);
            if (raw.magnitude < deadZone)
            {
                raw = Vector2.zero;
            }

            _filtered = Vector2.Lerp(_filtered, raw * sensitivity, smoothing);
            LookDelta = _filtered * Time.unscaledDeltaTime * 60f;
        }
    }
}
