using System;

namespace TFM.Gameplay.Modes
{
    public sealed class TFMModeRuntimePolicy
    {
        public bool ShouldStart(TFMModeSessionConfig config, TFMModeRuntimeSnapshot state, int minimumPlayers)
        {
            if (config == null || state == null) return false;
            config.Normalize();
            return state.Phase == TFMModeRuntimePhase.Waiting &&
                   state.ConnectedPlayers >= Math.Clamp(minimumPlayers, 1, config.PlayerCapacity);
        }

        public bool IsTimeExpired(TFMModeSessionConfig config, TFMModeRuntimeSnapshot state)
        {
            if (config == null || state == null) return true;
            config.Normalize();
            return state.ElapsedSeconds >= config.TimeLimitSeconds;
        }

        public bool IsScoreLimitReached(TFMModeSessionConfig config, TFMModeRuntimeSnapshot state)
        {
            if (config == null || state == null) return true;
            config.Normalize();
            return state.TeamAScore >= config.ScoreLimit || state.TeamBScore >= config.ScoreLimit;
        }

        public string ResolveWinningTeam(TFMModeRuntimeSnapshot state)
        {
            if (state == null || state.TeamAScore == state.TeamBScore) return string.Empty;
            return state.TeamAScore > state.TeamBScore ? "team-a" : "team-b";
        }
    }
}
