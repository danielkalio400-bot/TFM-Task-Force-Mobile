using TFM.Gameplay.Combat;
using TFM.Player.Controls;
using UnityEngine;

namespace TFM.Presentation
{
    /// <summary>
    /// Drives authored humanoid clips from the existing authoritative movement
    /// and offline practice weapon. Does not create or fake animation data.
    /// </summary>
    public sealed class TFMOperatorMotionBridge : MonoBehaviour
    {
        [SerializeField] private Transform motionSource;
        [SerializeField, Min(0.1f)] private float runSpeedMetersPerSecond = 7.5f;
        private Animator[] _animators;
        private bool[] _hasSpeed, _hasMoving, _hasGrounded, _hasFiring, _hasReloading;
        private CharacterController _motorCollider;
        private TFMPlayerInput _input;
        private TFMHitscanWeapon _practiceWeapon;
        private Vector3 _lastPosition;
        private static readonly int SpeedId = Animator.StringToHash("Speed");
        private static readonly int MovingId = Animator.StringToHash("IsMoving");
        private static readonly int GroundedId = Animator.StringToHash("Grounded");
        private static readonly int FiringId = Animator.StringToHash("IsFiring");
        private static readonly int ReloadingId = Animator.StringToHash("IsReloading");
        private static readonly int AimingId = Animator.StringToHash("IsAiming");
        private bool[] _hasAiming;
        private Transform _upperChest;
        private bool _authoredCombatLayer;
        private float _recoilPose;

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
            _hasFiring = new bool[_animators.Length];
            _hasReloading = new bool[_animators.Length];
            _hasAiming = new bool[_animators.Length];
            if (motionSource == null)
            {
                var controller = GetComponentInParent<CharacterController>();
                if (controller != null) motionSource = controller.transform;
            }
            _motorCollider = motionSource != null
                ? motionSource.GetComponent<CharacterController>() : null;
            _input = motionSource != null ? motionSource.GetComponent<TFMPlayerInput>() : null;
            _practiceWeapon = motionSource != null
                ? motionSource.GetComponent<TFMHitscanWeapon>() : null;
            _lastPosition = motionSource != null ? motionSource.position : transform.position;
            for (int index = 0; index < _animators.Length; index++)
            {
                Animator animator = _animators[index];
                if (animator == null) continue;
                // The CharacterController, not imported root motion, owns position.
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
                    if (parameter.nameHash == FiringId &&
                        parameter.type == AnimatorControllerParameterType.Bool)
                        _hasFiring[index] = true;
                    if (parameter.nameHash == ReloadingId &&
                        parameter.type == AnimatorControllerParameterType.Bool)
                        _hasReloading[index] = true;
                    if (parameter.nameHash == AimingId &&
                        parameter.type == AnimatorControllerParameterType.Bool)
                        _hasAiming[index] = true;
                }
            }
            // Low-intensity procedural fallback: preserves all authored locomotion.
            foreach (Animator animator in _animators)
            {
                if (animator == null || animator.avatar == null || !animator.avatar.isHuman) continue;
                _authoredCombatLayer |= animator.GetLayerIndex("TFM Combat Upper") >= 0;
                if (_upperChest == null)
                {
                    _upperChest = animator.GetBoneTransform(HumanBodyBones.UpperChest);
                    if (_upperChest == null) _upperChest = animator.GetBoneTransform(HumanBodyBones.Chest);
                }
            }
        }

        private void Update()
        {
            if (motionSource == null || _animators == null) return;
            Vector3 position = motionSource.position;
            Vector3 planar = position - _lastPosition;
            planar.y = 0f;
            _lastPosition = position;
            if (Time.deltaTime <= 0f) return;
            float speed = Mathf.Clamp01(planar.magnitude / Time.deltaTime / runSpeedMetersPerSecond);
            bool grounded = _motorCollider == null || _motorCollider.isGrounded;
            bool reloading = _practiceWeapon != null && _practiceWeapon.IsReloading;
            bool firing = !reloading && (_practiceWeapon != null
                ? _practiceWeapon.RecentShot
                : _input != null && _input.FireHeld);
            bool aiming = _input != null && _input.AimHeld;
            for (int i = 0; i < _animators.Length; i++)
            {
                Animator animator = _animators[i];
                if (animator == null || animator.runtimeAnimatorController == null) continue;
                if (_hasSpeed[i]) animator.SetFloat(SpeedId, speed);
                if (_hasMoving[i]) animator.SetBool(MovingId, speed > 0.025f);
                if (_hasGrounded[i]) animator.SetBool(GroundedId, grounded);
                if (_hasFiring[i]) animator.SetBool(FiringId, firing);
                if (_hasReloading[i]) animator.SetBool(ReloadingId, reloading);
                if (_hasAiming[i]) animator.SetBool(AimingId, aiming);
            }
        }

        private void LateUpdate()
        {
            // A minimal, original pose accent until licensed upper-body clips
            // are supplied. No synthetic full reload animation is claimed.
            if (_upperChest == null || _authoredCombatLayer) return;
            float target = _practiceWeapon != null && _practiceWeapon.RecentShot ? 3.5f :
                (_practiceWeapon != null && _practiceWeapon.IsReloading ? -1.3f :
                (_input != null && _input.AimHeld ? 1.3f : 0f));
            _recoilPose = Mathf.Lerp(_recoilPose, target,
                1f - Mathf.Exp(-14f * Time.deltaTime));
            _upperChest.localRotation = _upperChest.localRotation *
                Quaternion.Euler(_recoilPose, 0f, 0f);
        }
    }
}
