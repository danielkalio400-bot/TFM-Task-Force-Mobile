using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMLoadTestSummary
    {
        public string TestId = string.Empty;
        public string Region = string.Empty;
        public int TargetConcurrentPlayers;
        public int SuccessfulSessions;
        public int FailedSessions;
        public double P95LatencyMs;
        public double ErrorRate01;
        public bool Passed;
    }
}
