using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMOperationalIncident
    {
        public string IncidentId = string.Empty;
        public string Service = string.Empty;
        public string Region = string.Empty;
        public string Code = string.Empty;
        public TFMIncidentSeverity Severity;
        public string Summary = string.Empty;
        public long CreatedAtUnixSeconds;
        public bool Resolved;
    }
}
