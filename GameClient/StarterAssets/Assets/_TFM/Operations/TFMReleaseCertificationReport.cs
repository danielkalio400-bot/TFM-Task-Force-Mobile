using System;
using System.Collections.Generic;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMReleaseCertificationReport
    {
        public string ReportId = string.Empty;
        public string Platform = string.Empty;
        public string Channel = string.Empty;
        public string Version = string.Empty;
        public int BuildNumber;
        public string State = "blocked";
        public List<string> BlockingChecks = new();
        public long EvaluatedAtUnixSeconds;
    }
}
