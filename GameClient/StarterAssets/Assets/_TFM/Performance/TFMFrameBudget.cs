using System;

namespace TFM.Performance
{
    [Serializable]
    public sealed class TFMFrameBudget
    {
        public TFMDeviceQualityTier Tier;
        public int TargetFps = 60;
        public int MaxActivePlayers = 10;
        public int MaxDynamicLights = 4;
        public int MaxShadowedLights = 1;
        public float DynamicResolutionMin = 0.7f;

        public void Normalize()
        {
            TargetFps = Math.Clamp(TargetFps, 30, 120);
            MaxActivePlayers = Math.Clamp(MaxActivePlayers, 2, 100);
            MaxDynamicLights = Math.Clamp(MaxDynamicLights, 0, 32);
            MaxShadowedLights = Math.Clamp(MaxShadowedLights, 0, MaxDynamicLights);
            DynamicResolutionMin = Math.Clamp(DynamicResolutionMin, 0.5f, 1f);
        }
    }
}
