using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMPatchManifest
    {
        public string PatchId = string.Empty;
        public string Platform = string.Empty;
        public string Channel = string.Empty;
        public string Version = string.Empty;
        public int MinimumSupportedBuild;
        public int TargetBuild;
        public string IntegrityTag = string.Empty;
        public string PreviousPatchId = string.Empty;
        public bool Required;
        public int RolloutPercent;
        public string State = "draft";
        public string[] PackageIds = Array.Empty<string>();
    }
}
