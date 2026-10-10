using System;

namespace TFM.Online.Persistence
{
    [Serializable]
    public sealed class TFMSessionPersistenceSnapshot
    {
        public string SnapshotId = string.Empty;
        public string MatchId = string.Empty;
        public string SectionId = string.Empty;
        public string ModeId = string.Empty;
        public string MapId = string.Empty;
        public string Region = string.Empty;
        public string ServerId = string.Empty;
        public string RuntimePhase = string.Empty;
        public long Sequence;
        public long CapturedAtUnixMilliseconds;
        public bool Terminal;
    }
}
