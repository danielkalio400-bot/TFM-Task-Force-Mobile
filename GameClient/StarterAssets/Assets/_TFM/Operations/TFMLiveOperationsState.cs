using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMLiveOperationsState
    {
        public string Region = string.Empty;
        public bool MatchmakingEnabled = true;
        public bool RankedEnabled = true;
        public bool PrivateMatchesEnabled = true;
        public bool NewServerAssignmentsEnabled = true;
        public string MaintenanceMessage = string.Empty;
        public long UpdatedAtUnixSeconds;
    }
}
