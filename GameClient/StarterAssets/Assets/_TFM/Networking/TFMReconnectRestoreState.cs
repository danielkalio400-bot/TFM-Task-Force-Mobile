using System;

namespace TFM.Networking
{
    [Serializable]
    public sealed class TFMReconnectRestoreState
    {
        public string RestoreId = string.Empty;
        public string MatchId = string.Empty;
        public string PlayerId = string.Empty;
        public string ServerId = string.Empty;
        public string TeamId = string.Empty;
        public int Score;
        public int Health;
        public long ExpiresAtUnixSeconds;

        public bool IsExpired(long nowUnixSeconds) => nowUnixSeconds >= ExpiresAtUnixSeconds;
    }
}
