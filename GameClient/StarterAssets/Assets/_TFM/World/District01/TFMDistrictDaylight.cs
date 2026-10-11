using UnityEngine;
using UnityEngine.Rendering;

namespace TFM.World.District01
{
    // Local scene daylight loop: reuses the original sun, never adds extra
    // real-time shadow lights or alters global render pipeline assets.
    [DisallowMultipleComponent]
    public sealed class TFMDistrictDaylight : MonoBehaviour
    {
        [SerializeField] private Light sun;
        [SerializeField, Min(120f)] private float dayLengthSeconds = 840f;
        [SerializeField, Range(0f, 1f)] private float startTime = 0.38f;
        private float _timeOfDay;
        private float _nextUpdate;

        public void Configure(Light directionalSun) { sun = directionalSun; }
        private void Awake() { _timeOfDay = startTime; }

        private void Update()
        {
            if (sun == null || sun.type != LightType.Directional) return;
            _timeOfDay = Mathf.Repeat(_timeOfDay +
                Time.deltaTime / dayLengthSeconds, 1f);
            if (Time.unscaledTime < _nextUpdate) return;
            _nextUpdate = Time.unscaledTime + 0.15f;
            float altitude = Mathf.Sin((_timeOfDay - 0.25f) * 6.283185f);
            float daylightFactor = Mathf.SmoothStep(0f, 1f,
                Mathf.Clamp01((altitude + 0.18f) / 0.85f));
            sun.transform.rotation = Quaternion.Euler(
                _timeOfDay * 360f - 90f, -32f, 0f);
            sun.intensity = Mathf.Lerp(0.03f, 1.15f, daylightFactor);
            sun.color = Color.Lerp(new Color(0.55f, 0.64f, 0.85f),
                new Color(1f, 0.95f, 0.84f), daylightFactor);
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = Color.Lerp(
                new Color(0.11f, 0.16f, 0.25f),
                new Color(0.53f, 0.66f, 0.74f), daylightFactor);
            RenderSettings.ambientEquatorColor = Color.Lerp(
                new Color(0.10f, 0.12f, 0.16f),
                new Color(0.38f, 0.44f, 0.45f), daylightFactor);
            RenderSettings.ambientGroundColor = Color.Lerp(
                new Color(0.06f, 0.07f, 0.08f),
                new Color(0.22f, 0.23f, 0.22f), daylightFactor);
        }
    }
}
