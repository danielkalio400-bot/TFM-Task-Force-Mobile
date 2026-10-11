using UnityEngine;

namespace TFM.World.District01
{
    // Two-axis four-stage traffic signal with clearance (all-red) intervals.
    [DisallowMultipleComponent]
    public sealed class TFMDistrictTrafficSignal : MonoBehaviour
    {
        [SerializeField, Range(7f, 40f)] private float greenSeconds = 17f;
        [SerializeField, Range(1f, 6f)] private float clearanceSeconds = 2.5f;
        [SerializeField] private Renderer[] northSouthLamps;
        [SerializeField] private Renderer[] eastWestLamps;
        private MaterialPropertyBlock _propertyBlock;
        private float _phaseElapsed;
        private int _phase;
        public int Phase => _phase;
        public bool NorthSouthGreen => _phase == 0;
        public bool EastWestGreen => _phase == 2;

        public void Configure(Renderer[] northSouth, Renderer[] eastWest)
        {
            northSouthLamps = northSouth;
            eastWestLamps = eastWest;
        }

        private void Awake()
        {
            _propertyBlock = new MaterialPropertyBlock();
            Paint();
        }

        private void Update()
        {
            _phaseElapsed += Time.deltaTime;
            float duration = _phase % 2 == 0 ? greenSeconds : clearanceSeconds;
            if (_phaseElapsed < duration) return;
            _phaseElapsed = 0f;
            _phase = (_phase + 1) % 4;
            Paint();
        }

        private void Paint()
        {
            PaintSet(northSouthLamps, NorthSouthGreen);
            PaintSet(eastWestLamps, EastWestGreen);
        }

        private void PaintSet(Renderer[] lamps, bool green)
        {
            if (lamps == null || _propertyBlock == null) return;
            foreach (Renderer lamp in lamps)
            {
                if (lamp == null) continue;
                lamp.GetPropertyBlock(_propertyBlock);
                Color color = green ?
                    new Color(0.06f, 0.95f, 0.18f) :
                    new Color(0.95f, 0.08f, 0.05f);
                _propertyBlock.SetColor("_BaseColor", color);
                _propertyBlock.SetColor("_EmissionColor", color * 0.75f);
                lamp.SetPropertyBlock(_propertyBlock);
            }
        }
    }
}
