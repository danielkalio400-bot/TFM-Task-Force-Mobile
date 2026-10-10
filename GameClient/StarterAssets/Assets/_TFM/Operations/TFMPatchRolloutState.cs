using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMPatchRolloutState
    {
        public string PatchId = string.Empty;
        public int RolloutPercent;
        public string State = string.Empty;
        public long UpdatedAtUnixSeconds;
    }
}
