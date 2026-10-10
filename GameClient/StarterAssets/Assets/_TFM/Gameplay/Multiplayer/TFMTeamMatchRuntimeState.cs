using System;

namespace TFM.Gameplay.Multiplayer
{
    [Serializable]
    public sealed class TFMTeamMatchRuntimeState
    {
        public string MatchId = string.Empty;
        public int TeamAScore;
        public int TeamBScore;
        public int ScoreLimit = 50;
        public double ElapsedSeconds;
        public double TimeLimitSeconds = 600d;
        public bool Completed;
        public string WinningTeamId = string.Empty;

        public void Normalize()
        {
            TeamAScore = Math.Max(0, TeamAScore);
            TeamBScore = Math.Max(0, TeamBScore);
            ScoreLimit = Math.Max(1, ScoreLimit);
            ElapsedSeconds = Math.Max(0d, ElapsedSeconds);
            TimeLimitSeconds = Math.Max(60d, TimeLimitSeconds);
        }
    }
}
