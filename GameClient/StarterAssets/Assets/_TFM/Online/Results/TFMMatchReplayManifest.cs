using System;

namespace TFM.Online.Results
{
    [Serializable]
    public sealed class TFMMatchReplayManifest
    {
        public string MatchId = string.Empty;
        public long EventCount;
        public long FirstSequence;
        public long LastSequence;
        public bool Complete;
        public string ValidationState = string.Empty;
    }
}
