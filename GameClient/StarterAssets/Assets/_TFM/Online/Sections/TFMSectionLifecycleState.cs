using System;

namespace TFM.Online.Sections
{
    [Serializable]
    public sealed class TFMSectionLifecycleState
    {
        public string LifecycleId = string.Empty;
        public string SectionId = string.Empty;
        public string ModeId = string.Empty;
        public string MapId = string.Empty;
        public string MatchId = string.Empty;
        public TFMSectionLifecyclePhase Phase = TFMSectionLifecyclePhase.Idle;
        public string FailureCode = string.Empty;
        public long UpdatedAtUnixMilliseconds;
    }
}
