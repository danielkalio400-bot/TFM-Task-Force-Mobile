using UnityEngine;

namespace TFM.Platform
{
    [DefaultExecutionOrder(-900)]
    public sealed class TFMFrameRatePolicy : MonoBehaviour
    {
        [SerializeField] private bool autoApply = true;
        [SerializeField, Min(30)] private int mobileFallbackFrameRate = 60;
        [SerializeField] private int desktopTargetFrameRate = -1;

        public int AppliedTargetFrameRate { get; private set; }

        private void Awake()
        {
            if (autoApply)
            {
                Apply();
            }
        }

        public void Apply()
        {
            if (TFMPlatformCapabilities.IsMobile)
            {
                QualitySettings.vSyncCount = 0;
                int refresh = ResolveDisplayRefreshRate();
                AppliedTargetFrameRate = Mathf.Max(30, refresh > 0 ? refresh : mobileFallbackFrameRate);
                Application.targetFrameRate = AppliedTargetFrameRate;
                return;
            }

            QualitySettings.vSyncCount = 1;
            AppliedTargetFrameRate = desktopTargetFrameRate;
            Application.targetFrameRate = desktopTargetFrameRate;
        }

        private static int ResolveDisplayRefreshRate()
        {
#if UNITY_2022_2_OR_NEWER
            double value = Screen.currentResolution.refreshRateRatio.value;
            if (value > 1d)
            {
                return Mathf.RoundToInt((float)value);
            }
#endif
#pragma warning disable CS0618
            return Screen.currentResolution.refreshRate;
#pragma warning restore CS0618
        }
    }
}
