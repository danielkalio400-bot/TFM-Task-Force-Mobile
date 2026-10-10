using System;

namespace TFM.UI.Accessibility
{
    [Serializable]
    public sealed class TFMAccessibilitySettings
    {
        public float UiScale = 1f;
        public float SubtitleScale = 1f;
        public bool Subtitles = true;
        public bool ReduceMotion;
        public bool ScreenShake = true;
        public bool HoldToConfirmDangerousActions = true;
        public TFMColorVisionMode ColorVisionMode = TFMColorVisionMode.Default;

        public void Normalize()
        {
            UiScale = Math.Clamp(UiScale, 0.75f, 1.5f);
            SubtitleScale = Math.Clamp(SubtitleScale, 0.75f, 1.75f);
        }
    }
}
