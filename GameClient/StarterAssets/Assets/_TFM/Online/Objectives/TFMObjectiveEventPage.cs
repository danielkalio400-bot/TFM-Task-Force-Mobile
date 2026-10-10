using System;

namespace TFM.Online.Objectives
{
    [Serializable]
    public sealed class TFMObjectiveEvent
    {
        public long sequence;
        public string type = string.Empty;
        public long atMs;
        public string playerId = string.Empty;
        public string objectiveId = string.Empty;
    }

    [Serializable]
    public sealed class TFMObjectiveEventPage
    {
        public string matchId = string.Empty;
        public long revision;
        public long oldestSequence;
        public TFMObjectiveEvent[] events = Array.Empty<TFMObjectiveEvent>();
    }

    [Serializable]
    public sealed class TFMObjectiveReconnectView
    {
        public TFMServerObjectiveSnapshot snapshot;
        public TFMObjectiveEvent[] events = Array.Empty<TFMObjectiveEvent>();
        public bool resyncRequired;
        public long nextSequence;
        public bool hasMore;
        public bool progressionGranted;
    }
}
