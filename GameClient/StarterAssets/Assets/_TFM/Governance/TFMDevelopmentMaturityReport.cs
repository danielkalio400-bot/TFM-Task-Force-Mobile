using System;
using System.Collections.Generic;

namespace TFM.Governance
{
    [Serializable]
    public sealed class TFMDevelopmentMaturityReport
    {
        public string ReportId = string.Empty;
        public string RequestedStage = string.Empty;
        public string GrantedStage = string.Empty;
        public List<string> BlockingRequirements = new();
        public long EvaluatedAtUnixSeconds;
    }
}
