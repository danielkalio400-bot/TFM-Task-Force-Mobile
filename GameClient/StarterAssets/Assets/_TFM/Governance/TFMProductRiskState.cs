using System;

namespace TFM.Governance
{
    [Serializable]
    public sealed class TFMProductRiskState
    {
        public string RiskId = string.Empty;
        public string Category = string.Empty;
        public string Status = "open";
        public string MitigationEvidenceReference = string.Empty;
        public string OwnerTag = string.Empty;
        public long UpdatedAtUnixSeconds;
    }
}
