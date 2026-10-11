using TFM.Player.Controls;
using TFM.Gameplay.Combat;
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
        [Header("Original TFM Aim View")]
        [SerializeField, Range(30f, 70f)] private float aimFieldOfView = 49f;
        [SerializeField, Min(0.5f)] private float aimDistance = 2.9f;
        [SerializeField, Min(0f)] private float aimShoulder = 0.45f;
        [SerializeField, Min(0.5f)] private float aimTransitionSpeed = 8f;
        [SerializeField, Range(0f, 2f)] private float shotViewKickDegrees = 0.30f;

        [SerializeField] private Transform _target;
        [SerializeField] private TFMPlayerInput _input;
        private Vector3 _positionVelocity;
        private float _yaw;
        private float _pitch = 5f;
        private bool _snapNextFrame = true;
        private Camera _camera;
        private float _baseFieldOfView = 65f;
        private float _aimBlend;
        private TFMHitscanWeapon _weapon;

        public void Configure(Transform target, TFMPlayerInput input)
        {
            _target = target;
            _input = input;
            _yaw = target.eulerAngles.y;
            _snapNextFrame = true;
            TryBindWeapon();
            PositionCamera();
        }

        private void Awake()
        {
            _camera = GetComponent<Camera>();
            if (_camera != null) _baseFieldOfView = _camera.fieldOfView;
        }

        private void OnDisable()
        {
            if (_weapon != null) _weapon.ShotFired -= OnShotFired;
            _weapon = null;
        }

        private void TryBindWeapon()
        {
            if (_target == null || _weapon != null) return;
            _weapon = _target.GetComponent<TFMHitscanWeapon>();
            if (_weapon != null) _weapon.ShotFired += OnShotFired;
        }

        private void OnShotFired()
        {
            _pitch = Mathf.Clamp(_pitch - shotViewKickDegrees,
                pitchLimits.x, pitchLimits.y);
        }

        private void LateUpdate()
        {
            if (_target == null)
            {
                return;
            }
            TryBindWeapon();
            float targetBlend = _input != null && _input.AimHeld ? 1f : 0f;
            _aimBlend = Mathf.MoveTowards(_aimBlend, targetBlend,
                Time.deltaTime * aimTransitionSpeed);
            if (_camera == null) _camera = GetComponent<Camera>();
            if (_camera != null)
                _camera.fieldOfView = Mathf.Lerp(_baseFieldOfView, aimFieldOfView, _aimBlend);

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
                            Quaternion.Euler(0f, _yaw, 0f) * Vector3.right *
                            Mathf.Lerp(0.8f, aimShoulder, _aimBlend);
            Quaternion orbit = Quaternion.Euler(_pitch, _yaw, 0f);
            Vector3 direction = orbit * Vector3.back;
            float effectiveDistance = Mathf.Lerp(distance, aimDistance, _aimBlend);
            float safeDistance = effectiveDistance;

            if (Physics.SphereCast(
                    pivot,
                    0.2f,
                    direction,
                    out RaycastHit hit,
                    effectiveDistance,
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
