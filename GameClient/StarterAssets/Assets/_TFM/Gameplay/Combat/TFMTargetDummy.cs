using System.Collections;
using System.Linq;
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
        private bool _usesImportedTarget;

        public int Health => _health;
        public bool IsAlive => _alive;

        private void Awake()
        {
            // The editor's production-art installer disables primitive Body/Head
            // components without deleting their scene/gameplay anchors.
            // Capture only originally active hit surfaces: restoring all children
            // would resurrect hidden blockout meshes after the first respawn.
            _renderers = GetComponentsInChildren<Renderer>(true)
                .Where(renderer => renderer != null && renderer.enabled &&
                    renderer.gameObject.activeInHierarchy)
                .ToArray();
            _colliders = GetComponentsInChildren<Collider>(true)
                .Where(collider => collider != null && collider.enabled &&
                    collider.gameObject.activeInHierarchy && !collider.isTrigger)
                .ToArray();
            _usesImportedTarget = transform.Find("TFM Production Practice Target") != null;
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
                if (targetRenderer != null) targetRenderer.enabled = visible;
            }
            foreach (Collider targetCollider in _colliders)
            {
                if (targetCollider != null) targetCollider.enabled = visible;
            }
        }

        private void ApplyColor(Color color)
        {
            // Realistic imported prefabs own their PBR material/texture properties.
            // Use the weapon HUD hit marker for these assets, not an override that
            // recolors imported materials on hit or respawn.
            if (_usesImportedTarget) return;
            _propertyBlock.SetColor("_BaseColor", color);
            _propertyBlock.SetColor("_Color", color);
            foreach (Renderer targetRenderer in _renderers)
            {
                if (targetRenderer != null)
                    targetRenderer.SetPropertyBlock(_propertyBlock);
            }
        }
    }
}
