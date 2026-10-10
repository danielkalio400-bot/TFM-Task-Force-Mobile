using System;

namespace TFM.Content
{
    [Serializable]
    public sealed class TFMContentCompatibilityReport
    {
        public string ClientVersion = string.Empty;
        public int ManifestVersion;
        public TFMContentCompatibilityState State = TFMContentCompatibilityState.Unknown;
        public string[] MissingOrOutdatedPackIds = Array.Empty<string>();
        public string MessageKey = string.Empty;
    }
}
