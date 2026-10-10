using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMClientUpdateDecision
    {
        public string Platform = string.Empty;
        public string Channel = string.Empty;
        public int CurrentBuild;
        public string Decision = "current";
        public string PatchId = string.Empty;
        public int TargetBuild;
        public bool Required;
    }
}
