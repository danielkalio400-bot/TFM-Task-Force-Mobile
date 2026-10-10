using System;
using System.Collections.Generic;

namespace TFM.Online.Results
{
    [Serializable]
    public sealed class TFMAuthoritativeMatchRecord
    {
        public string MatchId = string.Empty;
        public string ServerId = string.Empty;
        public string SectionId = string.Empty;
        public string ModeId = string.Empty;
        public string MapId = string.Empty;
        public string ValidationProofId = string.Empty;
        public long StartedAtUnixMilliseconds;
        public long CompletedAtUnixMilliseconds;
        public List<TFMPlayerMatchSummary> Players = new();
    }

    [Serializable]
    public sealed class TFMPlayerMatchSummary
    {
        public string PlayerId = string.Empty;
        public string TeamId = string.Empty;
        public int Score;
        public int Eliminations;
        public int Assists;
    }
}
