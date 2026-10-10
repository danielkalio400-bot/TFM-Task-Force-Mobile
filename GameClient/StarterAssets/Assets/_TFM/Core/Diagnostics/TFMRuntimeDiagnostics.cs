using TFM.Platform;
using UnityEngine;

namespace TFM.Core.Diagnostics
{
    public static class TFMRuntimeDiagnostics
    {
        public static string BuildSummary()
        {
            return string.Join(
                "\n",
                "TFM runtime diagnostics",
                $"Platform: {Application.platform}",
                $"Family: {TFMPlatformCapabilities.Family}",
                $"Device: {SystemInfo.deviceModel}",
                $"CPU: {SystemInfo.processorType}",
                $"RAM: {SystemInfo.systemMemorySize} MB",
                $"GPU: {SystemInfo.graphicsDeviceName}",
                $"VRAM: {SystemInfo.graphicsMemorySize} MB",
                $"Recommended quality: {TFMPlatformCapabilities.RecommendQualityTier()}",
                $"Touch: {TFMPlatformCapabilities.SupportsTouch}",
                $"Gyroscope: {TFMPlatformCapabilities.SupportsGyroscope}");
        }
    }
}
