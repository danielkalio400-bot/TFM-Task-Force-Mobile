using TFM.Player.Controls;
using UnityEngine;

namespace TFM.Player.Camera
{
    [DefaultExecutionOrder(100)]
    public sealed class TFMThirdPersonCamera : MonoBehaviour
    {
        [SerializeField, Min(0.1f)] private float distance = 5.5f;
        [SerializeField, Min(0f)] private float targetHeight = 1.4f;
        [SerializeField, Min(0f)] private float lookSensitivity = 0.12f;
        [SerializeField, Min(0f)] private float positionSmoothTime = 0.04f;
        [SerializeField] private Vector2 pitchLimits = new Vector2(-20f, 65f);
        [SerializeField] private LayerMask collisionMask = ~(1 << 2);

        [SerializeField] private Transform _target;
        [SerializeField] private TFMPlayerInput _input;
        private Vector3 _positionVelocity;
        private float _yaw;
        private float _pitch = 5f;
        private bool _snapNextFrame = true;

        public void Configure(Transform target, TFMPlayerInput input)
        {
            _target = target;
            _input = input;
            _yaw = target.eulerAngles.y;
            _snapNextFrame = true;
            PositionCamera();
        }

        private void LateUpdate()
        {
            if (_target == null)
            {
                return;
            }

            if (_input != null)
            {
                _yaw += _input.Look.x * lookSensitivity;
                _pitch = Mathf.Clamp(
                    _pitch - _input.Look.y * lookSensitivity,
                    pitchLimits.x,
                    pitchLimits.y);
            }

            PositionCamera();
        }

        private void PositionCamera()
        {
            if (_target == null) return;
            // Shoulder offset keeps the player clear of the crosshair.
            Vector3 pivot = _target.position + Vector3.up * targetHeight +
                            Quaternion.Euler(0f, _yaw, 0f) * Vector3.right * 0.8f;
            Quaternion orbit = Quaternion.Euler(_pitch, _yaw, 0f);
            Vector3 direction = orbit * Vector3.back;
            float safeDistance = distance;

            if (Physics.SphereCast(
                    pivot,
                    0.2f,
                    direction,
                    out RaycastHit hit,
                    distance,
                    collisionMask,
                    QueryTriggerInteraction.Ignore))
            {
                safeDistance = Mathf.Max(0.35f, hit.distance - 0.15f);
            }

            Vector3 desiredPosition = pivot + direction * safeDistance;
            if (_snapNextFrame)
            {
                transform.position = desiredPosition;
                _snapNextFrame = false;
            }
            else
            {
                transform.position = Vector3.SmoothDamp(
                    transform.position,
                    desiredPosition,
                    ref _positionVelocity,
                    positionSmoothTime);
            }

            transform.rotation = Quaternion.LookRotation(pivot - transform.position, Vector3.up);
        }
    }
}
