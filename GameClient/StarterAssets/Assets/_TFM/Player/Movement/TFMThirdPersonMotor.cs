using TFM.Player.Controls;
using UnityEngine;

namespace TFM.Player.Movement
{
    [RequireComponent(typeof(CharacterController))]
    [DefaultExecutionOrder(-100)]
    public sealed class TFMThirdPersonMotor : MonoBehaviour
    {
        [SerializeField, Min(0f)] private float moveSpeed = 5f;
        [SerializeField, Min(0f)] private float sprintSpeed = 7.5f;
        [SerializeField, Min(0f)] private float rotationSmoothTime = 0.08f;
        [SerializeField, Min(0f)] private float jumpHeight = 1.25f;
        [SerializeField] private float gravity = -25f;

        private CharacterController _controller;
        [SerializeField] private TFMPlayerInput _input;
        [SerializeField] private Transform _cameraTransform;
        private float _verticalSpeed;
        private float _rotationVelocity;

        public void Configure(TFMPlayerInput input, Transform cameraTransform)
        {
            _input = input;
            _cameraTransform = cameraTransform;
        }

        private void Awake()
        {
            _controller = GetComponent<CharacterController>();
            if (_input == null)
            {
                _input = GetComponent<TFMPlayerInput>();
            }
        }

        private void Update()
        {
            if (_input == null)
            {
                return;
            }

            if (_controller.isGrounded && _verticalSpeed < 0f)
            {
                _verticalSpeed = -2f;
            }

            if (_controller.isGrounded && _input.JumpPressed)
            {
                _verticalSpeed = Mathf.Sqrt(jumpHeight * -2f * gravity);
            }

            _verticalSpeed += gravity * Time.deltaTime;

            Vector3 forward = _cameraTransform != null ? _cameraTransform.forward : Vector3.forward;
            Vector3 right = _cameraTransform != null ? _cameraTransform.right : Vector3.right;
            forward.y = 0f;
            right.y = 0f;
            forward.Normalize();
            right.Normalize();

            Vector3 direction = forward * _input.Move.y + right * _input.Move.x;
            if (direction.sqrMagnitude > 1f)
            {
                direction.Normalize();
            }

            if (direction.sqrMagnitude > 0.001f)
            {
                float targetAngle = Mathf.Atan2(direction.x, direction.z) * Mathf.Rad2Deg;
                float angle = Mathf.SmoothDampAngle(
                    transform.eulerAngles.y,
                    targetAngle,
                    ref _rotationVelocity,
                    rotationSmoothTime);
                transform.rotation = Quaternion.Euler(0f, angle, 0f);
            }

            float speed = _input.SprintHeld ? sprintSpeed : moveSpeed;
            Vector3 velocity = direction * speed + Vector3.up * _verticalSpeed;
            _controller.Move(velocity * Time.deltaTime);
        }
    }
}
