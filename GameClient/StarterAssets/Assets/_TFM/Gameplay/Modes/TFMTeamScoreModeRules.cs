using System;
using TFM.Gameplay.Match;

namespace TFM.Gameplay.Modes
{
    public sealed class TFMTeamScoreModeRules : ITFMModeRuleSet
    {
        public string ModeId => "team-score";

        public bool IsComplete(TFMModeRuntimeContext context)
        {
            if (context == null) return true;
            context.Rules.Normalize();

            if (context.ElapsedSeconds >= context.Rules.matchDurationSeconds) return true;

            foreach (string teamId in context.TeamIds)
            {
                if (context.Scores.TeamScore(teamId) >= context.Rules.scoreToWin)
                    return true;
            }

            return false;
        }

        public string ResolveWinningTeam(TFMModeRuntimeContext context)
        {
            if (context == null) return string.Empty;

            string winner = string.Empty;
            int best = int.MinValue;
            bool tied = false;

            foreach (string teamId in context.TeamIds)
            {
                int score = context.Scores.TeamScore(teamId);
                if (score > best)
                {
                    winner = teamId;
                    best = score;
                    tied = false;
                }
                else if (score == best)
                {
                    tied = true;
                }
            }

            return tied ? string.Empty : winner;
        }
    }
}
