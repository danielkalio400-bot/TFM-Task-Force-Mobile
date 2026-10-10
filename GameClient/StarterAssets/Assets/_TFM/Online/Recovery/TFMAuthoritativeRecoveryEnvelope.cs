using System;

namespace TFM.Online.Recovery
{
    [Serializable]
    public sealed class TFMAuthoritativeRecoveryEnvelope
    {
        public string RecoveryId = string.Empty;
        public string MatchId = string.Empty;
        public string PlayerId = string.Empty;
        public string SectionId = string.Empty;
        public string ServerId = string.Empty;
        public string RuntimePhase = string.Empty;
        public long SnapshotSequence;
        public long ExpiresAtUnixSeconds;
        public bool Restorable;
    }
}
