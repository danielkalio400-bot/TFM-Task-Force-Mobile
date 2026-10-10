using UnityEngine;

namespace TFM.Presentation
{
    // Bridges the physical player movement to imported authored animations.
    // Only pre-existing Animator parameters are written. No animations are synthesized.
    public sealed class TFMOperatorMotionBridge : MonoBehaviour
    {
        [SerializeField] private Transform motionSource;
        [SerializeField, Min(0.1f)] private float runSpeedMetersPerSecond = 6f;
        private Animator[] _animators;
        private bool[] _hasSpeed, _hasMoving, _hasGrounded;
        private CharacterController _motorCollider;
        private Vector3 _lastPosition;
        private static readonly int SpeedId = Animator.StringToHash("Speed");
        private static readonly int MovingId = Animator.StringToHash("IsMoving");
        private static readonly int GroundedId = Animator.StringToHash("Grounded");

        public void Configure(Transform actor)
        {
            motionSource = actor;
            _lastPosition = actor != null ? actor.position : transform.position;
        }

        private void Awake()
        {
            _animators = GetComponentsInChildren<Animator>(true);
            _hasSpeed = new bool[_animators.Length];
            _hasMoving = new bool[_animators.Length];
            _hasGrounded = new bool[_animators.Length];
            _motorCollider = motionSource != null
                ? motionSource.GetComponent<CharacterController>() : null;
            _lastPosition = motionSource != null ? motionSource.position : transform.position;
            for (int index = 0; index < _animators.Length; index++)
            {
                Animator animator = _animators[index];
                if (animator == null) continue;
                // CharacterController owns movement; authored clips provide visuals.
                // Applying imported root motion would drift the visual away from
                // the authoritative player position and compromise hit alignment.
                animator.applyRootMotion = false;
                foreach (AnimatorControllerParameter parameter in animator.parameters)
                {
                    if (parameter.nameHash == SpeedId &&
                        parameter.type == AnimatorControllerParameterType.Float)
                        _hasSpeed[index] = true;
                    if (parameter.nameHash == MovingId &&
                        parameter.type == AnimatorControllerParameterType.Bool)
                        _hasMoving[index] = true;
                    if (parameter.nameHash == GroundedId &&
                        parameter.type == AnimatorControllerParameterType.Bool)
                        _hasGrounded[index] = true;
                }
            }
        }

        private void Update()
        {
            if (motionSource == null) return;
            Vector3 position = motionSource.position;
            Vector3 planar = position - _lastPosition;
            planar.y = 0f;
            _lastPosition = position;
            if (Time.deltaTime <= 0f || _animators == null) return;
            float speed = Mathf.Clamp01(planar.magnitude / Time.deltaTime / runSpeedMetersPerSecond);
            bool grounded = _motorCollider == null || _motorCollider.isGrounded;
            for (int i = 0; i < _animators.Length; i++)
            {
                Animator animator = _animators[i];
                if (animator == null || animator.runtimeAnimatorController == null) continue;
                if (_hasSpeed[i]) animator.SetFloat(SpeedId, speed);
                if (_hasMoving[i]) animator.SetBool(MovingId, speed > 0.025f);
                if (_hasGrounded[i]) animator.SetBool(GroundedId, grounded);
            }
        }
    }
}
