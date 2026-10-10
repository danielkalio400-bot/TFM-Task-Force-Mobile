using System;

namespace TFM.Gameplay.Modes
{
    [Serializable]
    public sealed class TFMModeSessionConfig
    {
        public string MatchId = string.Empty;
        public string ModeId = string.Empty;
        public string MapId = string.Empty;
        public int PlayerCapacity = 10;
        public int TeamSize = 5;
        public int TimeLimitSeconds = 600;
        public int ScoreLimit = 50;
        public bool RespawnEnabled = true;
        public bool Ranked;

        public void Normalize()
        {
            PlayerCapacity = Math.Clamp(PlayerCapacity, 1, 100);
            TeamSize = Math.Clamp(TeamSize, 1, PlayerCapacity);
            TimeLimitSeconds = Math.Clamp(TimeLimitSeconds, 60, 7200);
            ScoreLimit = Math.Clamp(ScoreLimit, 1, 10000);
        }
    }
}
