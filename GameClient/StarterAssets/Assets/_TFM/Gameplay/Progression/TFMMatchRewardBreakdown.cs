using System;

namespace TFM.Gameplay.Progression
{
    [Serializable]
    public sealed class TFMMatchRewardBreakdown
    {
        public string MatchId = string.Empty;
        public string PlayerId = string.Empty;
        public long BaseExperience;
        public long ObjectiveExperience;
        public long TeamResultExperience;
        public int SoftCredits;

        public long TotalExperience =>
            Math.Max(0L, BaseExperience) +
            Math.Max(0L, ObjectiveExperience) +
            Math.Max(0L, TeamResultExperience);
    }
}
