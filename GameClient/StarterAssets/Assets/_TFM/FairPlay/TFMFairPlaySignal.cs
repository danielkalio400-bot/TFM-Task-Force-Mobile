using System;

namespace TFM.FairPlay
{
    [Serializable]
    public sealed class TFMFairPlaySignal
    {
        public string SignalId = string.Empty;
        public string PlayerId = string.Empty;
        public string MatchId = string.Empty;
        public TFMFairPlaySignalType Type;
        public float Confidence01;
        public string ReviewContext = string.Empty;
        public long CreatedAtUnixSeconds;
    }
}
