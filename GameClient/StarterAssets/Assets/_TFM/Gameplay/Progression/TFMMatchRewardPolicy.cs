using System;

namespace TFM.Gameplay.Progression
{
    public static class TFMMatchRewardPolicy
    {
        public static TFMMatchRewardBreakdown Calculate(
            string matchId,
            string playerId,
            int score,
            int objectives,
            bool won)
        {
            int safeScore = Math.Max(0, score);
            int safeObjectives = Math.Max(0, objectives);

            return new TFMMatchRewardBreakdown
            {
                MatchId = matchId ?? string.Empty,
                PlayerId = playerId ?? string.Empty,
                BaseExperience = 100L + safeScore * 2L,
                ObjectiveExperience = safeObjectives * 35L,
                TeamResultExperience = won ? 150L : 50L,
                SoftCredits = Math.Clamp(40 + safeScore / 5 + (won ? 30 : 10), 0, 5000)
            };
        }
    }
}
