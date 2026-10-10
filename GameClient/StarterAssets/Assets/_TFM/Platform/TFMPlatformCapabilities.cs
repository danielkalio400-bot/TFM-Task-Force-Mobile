using UnityEngine;

namespace TFM.Platform
{
    public static class TFMPlatformCapabilities
    {
        public static TFMPlatformFamily Family
        {
            get
            {
#if UNITY_ANDROID || UNITY_IOS
                return TFMPlatformFamily.Mobile;
#elif UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
                return TFMPlatformFamily.Desktop;
#else
                return Application.isMobilePlatform ? TFMPlatformFamily.Mobile : TFMPlatformFamily.Unknown;
#endif
            }
        }

        public static bool SupportsTouch => Input.touchSupported || Application.isMobilePlatform;
        public static bool SupportsGyroscope => SystemInfo.supportsGyroscope;
        public static bool IsMobile => Family == TFMPlatformFamily.Mobile;
        public static bool IsWindows =>
            Application.platform == RuntimePlatform.WindowsPlayer ||
            Application.platform == RuntimePlatform.WindowsEditor;

        public static int SystemMemoryMb => SystemInfo.systemMemorySize;
        public static int GraphicsMemoryMb => SystemInfo.graphicsMemorySize;

        public static TFMQualityTier RecommendQualityTier()
        {
            if (IsMobile)
            {
                if (SystemMemoryMb > 0 && SystemMemoryMb < 5000) return TFMQualityTier.Low;
                if (SystemMemoryMb > 0 && SystemMemoryMb < 8000) return TFMQualityTier.Medium;
                return TFMQualityTier.High;
            }

            if (GraphicsMemoryMb > 0 && GraphicsMemoryMb < 4000) return TFMQualityTier.Low;
            if (GraphicsMemoryMb > 0 && GraphicsMemoryMb < 8000) return TFMQualityTier.Medium;
            if (GraphicsMemoryMb > 0 && GraphicsMemoryMb < 12000) return TFMQualityTier.High;
            return TFMQualityTier.Ultra;
        }
    }
}
