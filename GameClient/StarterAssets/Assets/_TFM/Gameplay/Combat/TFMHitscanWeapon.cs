using TFM.Player.Controls;
using UnityEngine;

namespace TFM.Gameplay.Combat
{
    public sealed class TFMHitscanWeapon : MonoBehaviour
    {
        [SerializeField, Min(1)] private int magazineSize = 30;
        [SerializeField, Min(0)] private int startingReserveAmmo = 120;
        [SerializeField, Min(1)] private int damage = 34;
        [SerializeField, Min(0.01f)] private float shotsPerSecond = 9f;
        [SerializeField, Min(0.1f)] private float reloadDuration = 1.6f;
        [SerializeField, Min(1f)] private float range = 120f;
        [SerializeField] private LayerMask hitMask = ~(1 << 2);

        private TFMPlayerInput _input;
        private Camera _aimCamera;
        private float _nextShotTime;
        private float _reloadCompleteTime;
        private float _hitMarkerUntil;

        public int CurrentAmmo { get; private set; }
        public int ReserveAmmo { get; private set; }
        public bool IsReloading { get; private set; }
        public bool HitMarkerVisible => Time.time < _hitMarkerUntil;

        public void Configure(TFMPlayerInput input, Camera aimCamera)
        {
            _input = input;
            _aimCamera = aimCamera;
        }

        private void Awake()
        {
            CurrentAmmo = magazineSize;
            ReserveAmmo = startingReserveAmmo;
            if (_input == null)
            {
                _input = GetComponent<TFMPlayerInput>();
            }
        }

        private void Update()
        {
            if (_input == null || _aimCamera == null)
            {
                return;
            }

            if (IsReloading)
            {
                if (Time.time >= _reloadCompleteTime)
                {
                    CompleteReload();
                }
                return;
            }

            if (_input.ReloadPressed)
            {
                StartReload();
                return;
            }

            if (_input.FireHeld && Time.time >= _nextShotTime)
            {
                Fire();
            }
        }

        public void StartReload()
        {
            if (IsReloading || CurrentAmmo >= magazineSize || ReserveAmmo <= 0)
            {
                return;
            }

            IsReloading = true;
            _reloadCompleteTime = Time.time + reloadDuration;
        }

        private void CompleteReload()
        {
            int requested = magazineSize - CurrentAmmo;
            int loaded = Mathf.Min(requested, ReserveAmmo);
            CurrentAmmo += loaded;
            ReserveAmmo -= loaded;
            IsReloading = false;
        }

        private void Fire()
        {
            if (CurrentAmmo <= 0)
            {
                StartReload();
                return;
            }

            CurrentAmmo--;
            _nextShotTime = Time.time + 1f / shotsPerSecond;

            Ray shot = _aimCamera.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0f));
            if (Physics.Raycast(
                    shot,
                    out RaycastHit hit,
                    range,
                    hitMask,
                    QueryTriggerInteraction.Ignore))
            {
                TFMTargetDummy target = hit.collider.GetComponentInParent<TFMTargetDummy>();
                if (target != null && target.TakeDamage(damage))
                {
                    _hitMarkerUntil = Time.time + 0.12f;
                }
            }

            Debug.DrawRay(shot.origin, shot.direction * range, Color.cyan, 0.12f);
        }
    }
}
