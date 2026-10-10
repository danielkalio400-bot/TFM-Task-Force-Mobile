namespace TFM.Gameplay.Multiplayer
{
    public sealed class TFMTeamMatchPolicy
    {
        public bool EvaluateCompletion(TFMTeamMatchRuntimeState state)
        {
            if (state == null) return false;
            state.Normalize();

            if (state.TeamAScore >= state.ScoreLimit ||
                state.TeamBScore >= state.ScoreLimit ||
                state.ElapsedSeconds >= state.TimeLimitSeconds)
            {
                state.Completed = true;
                state.WinningTeamId = state.TeamAScore == state.TeamBScore
                    ? string.Empty
                    : state.TeamAScore > state.TeamBScore ? "team-a" : "team-b";
            }

            return state.Completed;
        }
    }
}
