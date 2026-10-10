using System;

namespace TFM.Gameplay.Match
{
    [Serializable]
    public sealed class TFMMatchResultRecord
    {
        public string MatchId = string.Empty;
        public string ServerId = string.Empty;
        public string ModeId = string.Empty;
        public string WinningTeamId = string.Empty;
        public long StartedAtUnixSeconds;
        public long CompletedAtUnixSeconds;
        public TFMPlayerMatchResult[] Players = Array.Empty<TFMPlayerMatchResult>();
    }

    [Serializable]
    public sealed class TFMPlayerMatchResult
    {
        public string PlayerId = string.Empty;
        public string TeamId = string.Empty;
        public int Score;
        public int Eliminations;
        public int Assists;
        public long ExperienceGranted;
    }
}
