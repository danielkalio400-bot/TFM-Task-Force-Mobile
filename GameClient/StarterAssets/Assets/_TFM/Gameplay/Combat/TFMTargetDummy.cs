using System.Collections;
using UnityEngine;

namespace TFM.Gameplay.Combat
{
    public sealed class TFMTargetDummy : MonoBehaviour
    {
        [SerializeField, Min(1)] private int maxHealth = 100;
        [SerializeField, Min(0.1f)] private float respawnDelay = 2.5f;
        [SerializeField] private Color targetColor = new Color(0.78f, 0.18f, 0.14f);
        [SerializeField] private Color hitColor = new Color(1f, 0.85f, 0.2f);

        private Renderer[] _renderers;
        private Collider[] _colliders;
        private MaterialPropertyBlock _propertyBlock;
        private Coroutine _flashRoutine;
        private int _health;
        private bool _alive;

        public int Health => _health;
        public bool IsAlive => _alive;

        private void Awake()
        {
            _renderers = GetComponentsInChildren<Renderer>();
            _colliders = GetComponentsInChildren<Collider>();
            _propertyBlock = new MaterialPropertyBlock();
            ResetTarget();
        }

        // Clears any prior respawn/flash coroutine when starting a new drill.
        // Never called from competitive authoritative gameplay.
        public void ResetForTrial()
        {
            StopAllCoroutines();
            _flashRoutine = null;
            ResetTarget();
        }

        public bool TakeDamage(int amount)
        {
            if (!_alive || amount <= 0)
            {
                return false;
            }

            _health = Mathf.Max(0, _health - amount);
            if (_health == 0)
            {
                StartCoroutine(Respawn());
            }
            else
            {
                if (_flashRoutine != null)
                {
                    StopCoroutine(_flashRoutine);
                }
                _flashRoutine = StartCoroutine(FlashHit());
            }

            return true;
        }

        private IEnumerator FlashHit()
        {
            ApplyColor(hitColor);
            yield return new WaitForSeconds(0.08f);
            ApplyColor(targetColor);
            _flashRoutine = null;
        }

        private IEnumerator Respawn()
        {
            _alive = false;
            SetTargetVisible(false);
            yield return new WaitForSeconds(respawnDelay);
            ResetTarget();
        }

        private void ResetTarget()
        {
            _health = maxHealth;
            _alive = true;
            SetTargetVisible(true);
            ApplyColor(targetColor);
        }

        private void SetTargetVisible(bool visible)
        {
            foreach (Renderer targetRenderer in _renderers)
            {
                targetRenderer.enabled = visible;
            }
            foreach (Collider targetCollider in _colliders)
            {
                targetCollider.enabled = visible;
            }
        }

        private void ApplyColor(Color color)
        {
            _propertyBlock.SetColor("_BaseColor", color);
            _propertyBlock.SetColor("_Color", color);
            foreach (Renderer targetRenderer in _renderers)
            {
                targetRenderer.SetPropertyBlock(_propertyBlock);
            }
        }
    }
}
