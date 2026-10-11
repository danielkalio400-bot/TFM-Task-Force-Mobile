using TFM.Gameplay.Combat;
using UnityEngine;

namespace TFM.Gameplay.Combat
{
    /// <summary>
    /// Authored local patrol locomotion using an actual humanoid mesh/controller.
    /// Lightweight offline world-character behavior, not server-side enemy AI.
    /// </summary>
    [RequireComponent(typeof(TFMTargetDummy))]
    [DisallowMultipleComponent]
    public sealed class TFMDistrictPatrol : MonoBehaviour
    {
        [SerializeField] private Vector3 localA;
        [SerializeField] private Vector3 localB;
        [SerializeField, Range(0.5f, 3.5f)] private float walkSpeed = 1.65f;
        [SerializeField, Range(0.05f, 1f)] private float turnSpeed = 0.16f;

        private TFMTargetDummy _target;
        private Animator _animator;
        private int _destination = 1;
        private static readonly int SpeedId = Animator.StringToHash("Speed");
        private static readonly int MovingId = Animator.StringToHash("IsMoving");
        private bool _hasSpeed;
        private bool _hasMoving;

        public void Configure(Vector3 first, Vector3 second, float speed)
        {
            localA = first;
            localB = second;
            walkSpeed = Mathf.Clamp(speed, 0.5f, 3.5f);
        }

        private void Awake()
        {
            _target = GetComponent<TFMTargetDummy>();
            _animator = GetComponentInChildren<Animator>(true);
            if (_animator == null) return;
            _animator.applyRootMotion = false;
            if (_animator.runtimeAnimatorController == null) return;
            foreach (AnimatorControllerParameter parameter in _animator.parameters)
            {
                if (parameter.nameHash == SpeedId &&
                    parameter.type == AnimatorControllerParameterType.Float)
                    _hasSpeed = true;
                if (parameter.nameHash == MovingId &&
                    parameter.type == AnimatorControllerParameterType.Bool)
                    _hasMoving = true;
            }
        }

        private void Update()
        {
            if (_target == null || !_target.IsAlive)
            {
                SetAnimation(0f, false);
                return;
            }

            Vector3 destination = _destination == 0 ? localA : localB;
            Vector3 before = transform.localPosition;
            Vector3 after = Vector3.MoveTowards(before, destination, walkSpeed * Time.deltaTime);
            transform.localPosition = after;

            Vector3 delta = after - before;
            delta.y = 0f;
            bool moving = delta.sqrMagnitude > 0.000001f;
            if (moving)
            {
                Quaternion facing = Quaternion.LookRotation(delta.normalized, Vector3.up);
                transform.localRotation = Quaternion.Slerp(transform.localRotation, facing,
                    1f - Mathf.Exp(-8f * turnSpeed * Time.deltaTime));
            }
            else
            {
                _destination = 1 - _destination;
            }

            // The operator's existing controller uses 0 = idle, 0.67 = walk.
            SetAnimation(moving ? 0.67f : 0f, moving);
        }

        private void SetAnimation(float speed, bool moving)
        {
            if (_animator == null || _animator.runtimeAnimatorController == null) return;
            if (_hasSpeed) _animator.SetFloat(SpeedId, speed, 0.08f, Time.deltaTime);
            if (_hasMoving) _animator.SetBool(MovingId, moving);
        }
    }
}
