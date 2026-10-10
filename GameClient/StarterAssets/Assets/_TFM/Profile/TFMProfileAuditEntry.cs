using System;

namespace TFM.Profile
{
    [Serializable]
    public sealed class TFMProfileAuditEntry
    {
        public string AuditId = string.Empty;
        public string PlayerId = string.Empty;
        public string Action = string.Empty;
        public long RecordedAtUnixSeconds;
    }
}
