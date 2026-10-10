using System;

namespace TFM.Persistence
{
    [Serializable]
    public sealed class TFMSessionRecoveryData
    {
        public string recoveryId = "";
        public string playerId = "";
        public string matchId = "";
        public string state = "issued";
        public long expiresAtUnixSeconds;

        public bool IsExpired(long nowUnixSeconds) => nowUnixSeconds >= expiresAtUnixSeconds;
    }
}
