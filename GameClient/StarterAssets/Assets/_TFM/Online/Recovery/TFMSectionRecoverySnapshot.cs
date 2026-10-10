using System;

namespace TFM.Online.Recovery
{
    [Serializable]
    public sealed class TFMSectionRecoverySnapshot
    {
        public string RecoveryId = string.Empty;
        public string MatchId = string.Empty;
        public string PlayerId = string.Empty;
        public string SectionId = string.Empty;
        public string ServerId = string.Empty;
        public string MapId = string.Empty;
        public string RuntimePhase = string.Empty;
        public int Score;
        public int Health;
        public long ExpiresAtUnixSeconds;
        public bool Consumed;

        public bool IsExpired(long nowUnixSeconds) => nowUnixSeconds >= ExpiresAtUnixSeconds;
    }
}
