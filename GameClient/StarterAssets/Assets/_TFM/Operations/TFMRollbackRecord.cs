using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMRollbackRecord
    {
        public string RollbackId = string.Empty;
        public string DeploymentId = string.Empty;
        public string ReasonCode = string.Empty;
        public string RestoredVersion = string.Empty;
        public long RecordedAtUnixSeconds;
    }
}
