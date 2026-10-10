using System;

namespace TFM.Online.Sections
{
    [Serializable]
    public sealed class TFMSectionLaunchRequest
    {
        public string SectionId = string.Empty;
        public string ModeId = string.Empty;
        public string MapId = string.Empty;
        public string Region = string.Empty;
        public string ClientVersion = string.Empty;
        public int ManifestVersion = 1;
        public int PlayerCount = 1;
    }
}
