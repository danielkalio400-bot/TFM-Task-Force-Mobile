using UnityEngine;

namespace TFM.Presentation
{
    /// <summary>
    /// Original, optional operator energy rings. These are presentation-only:
    /// imported mesh, skeleton, animation, and authoritative player movement
    /// stay completely untouched.
    /// </summary>
    public sealed class TFMOperatorEnergyAura : MonoBehaviour
    {
        [SerializeField] private Transform lowerRing;
        [SerializeField] private Transform upperRing;
        [SerializeField] private Renderer lowerRenderer;
        [SerializeField] private Renderer upperRenderer;
        [SerializeField, Range(0f, 180f)] private float rotationSpeed = 35f;
        [SerializeField, Range(0f, 0.15f)] private float floatAmplitude = 0.035f;
        [SerializeField] private bool reduceEffectsOnEntryDevices = true;

        private MaterialPropertyBlock _block;
        private Vector3 _upperBasePosition;
        private bool _reduceComplexity;

        public void Configure(Transform lower, Transform upper,
            Renderer lowerArt, Renderer upperArt)
        {
            lowerRing = lower;
            upperRing = upper;
            lowerRenderer = lowerArt;
            upperRenderer = upperArt;
            _upperBasePosition = upper != null ? upper.localPosition : Vector3.zero;
        }

        private void Awake()
        {
            _block = new MaterialPropertyBlock();
            _upperBasePosition = upperRing != null ? upperRing.localPosition : Vector3.zero;
            _reduceComplexity = reduceEffectsOnEntryDevices &&
                Application.isMobilePlatform &&
                (SystemInfo.graphicsMemorySize < 2500 || QualitySettings.GetQualityLevel() <= 1);
            if (_reduceComplexity && upperRing != null)
                upperRing.gameObject.SetActive(false);
        }

        private void Update()
        {
            if (lowerRing != null)
                lowerRing.Rotate(Vector3.up, rotationSpeed * Time.deltaTime, Space.Self);

            if (_reduceComplexity || upperRing == null) return;
            upperRing.Rotate(Vector3.up, -rotationSpeed * 0.5f * Time.deltaTime, Space.Self);
            upperRing.localPosition = _upperBasePosition +
                Vector3.up * (Mathf.Sin(Time.time * 2.1f) * floatAmplitude);

            if (upperRenderer != null)
            {
                // Color changes only our own generated ring material, never
                // a character's original imported skin, armor or fabric PBR.
                float glow = 1.2f + 0.6f * (0.5f + 0.5f * Mathf.Sin(Time.time * 2f));
                upperRenderer.GetPropertyBlock(_block);
                _block.SetColor("_EmissionColor", new Color(0.02f, glow, glow * 1.2f));
                upperRenderer.SetPropertyBlock(_block);
            }
        }

        private void OnDisable()
        {
            if (upperRenderer != null)
                upperRenderer.SetPropertyBlock(null);
        }
    }
}
