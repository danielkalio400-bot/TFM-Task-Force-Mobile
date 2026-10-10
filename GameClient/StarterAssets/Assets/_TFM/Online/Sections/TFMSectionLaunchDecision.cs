using System;

namespace TFM.Online.Sections
{
    [Serializable]
    public sealed class TFMSectionLaunchDecision
    {
        public bool Allowed;
        public string LifecycleId = string.Empty;
        public string RuntimeId = string.Empty;
        public string BlockingCode = string.Empty;
        public string[] MissingContentPackIds = Array.Empty<string>();
    }
}
