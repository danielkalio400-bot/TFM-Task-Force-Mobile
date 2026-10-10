using System;

namespace TFM.Gameplay.Sections
{
    [Serializable]
    public sealed class TFMSectionState
    {
        public TFMHomeSection Section;
        public TFMSectionAvailability Availability = TFMSectionAvailability.Installed;
        public float DownloadProgress01;
        public string StatusMessage = string.Empty;

        public void Normalize()
        {
            DownloadProgress01 = Math.Clamp(DownloadProgress01, 0f, 1f);
        }
    }
}
