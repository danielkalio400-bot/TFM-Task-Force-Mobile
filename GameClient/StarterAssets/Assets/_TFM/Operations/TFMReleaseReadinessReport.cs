using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMReleaseReadinessReport
    {
        public string BuildId = string.Empty;
        public string Platform = string.Empty;
        public TFMReleaseGateState State = TFMReleaseGateState.NotEvaluated;
        public bool CoreContentReady;
        public bool SelectedMapsReady;
        public bool BackendHealthReady;
        public bool RecoveryReady;
        public bool PerformanceReady;
        public bool QaReady;
        public string[] BlockingReasons = Array.Empty<string>();
    }
}
