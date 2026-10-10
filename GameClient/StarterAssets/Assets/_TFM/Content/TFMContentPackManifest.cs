using System;

namespace TFM.Content
{
    [Serializable]
    public sealed class TFMContentPackManifest
    {
        public string PackId = string.Empty;
        public string DisplayName = string.Empty;
        public string SectionId = string.Empty;
        public string Version = string.Empty;
        public long EstimatedDownloadBytes;
        public bool RequiredForOnlinePlay;
        public string[] MapIds = Array.Empty<string>();
    }
}
