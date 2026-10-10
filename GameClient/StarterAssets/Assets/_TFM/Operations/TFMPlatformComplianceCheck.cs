using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMPlatformComplianceCheck
    {
        public string CheckId = string.Empty;
        public string Platform = string.Empty;
        public string Category = string.Empty;
        public string Status = "pending";
        public string EvidenceReference = string.Empty;
        public bool Required = true;
    }
}
