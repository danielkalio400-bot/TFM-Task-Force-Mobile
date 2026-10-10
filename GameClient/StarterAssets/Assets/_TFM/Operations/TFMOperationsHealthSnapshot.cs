using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMOperationsHealthSnapshot
    {
        public TFMServiceHealth Matchmaking = TFMServiceHealth.Unknown;
        public TFMServiceHealth GameServers = TFMServiceHealth.Unknown;
        public TFMServiceHealth Progression = TFMServiceHealth.Unknown;
        public int ReadyServers;
        public int OpenIncidents;
        public long CapturedAtUnixSeconds;
    }
}
