using System;

namespace TFM.Online.Results
{
    [Serializable]
    public sealed class TFMReplayTelemetryEvent
    {
        public string EventId = string.Empty;
        public string MatchId = string.Empty;
        public long Sequence;
        public long MatchTimeMilliseconds;
        public string EventType = string.Empty;
        public string ActorPlayerId = string.Empty;
        public string TargetPlayerId = string.Empty;
        public string ObjectiveId = string.Empty;
        public string MetadataTag = string.Empty;
    }
}
