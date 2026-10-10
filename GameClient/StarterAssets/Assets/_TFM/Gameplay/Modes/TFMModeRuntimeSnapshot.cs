using System;

namespace TFM.Gameplay.Modes
{
    [Serializable]
    public sealed class TFMModeRuntimeSnapshot
    {
        public string MatchId = string.Empty;
        public TFMModeRuntimePhase Phase = TFMModeRuntimePhase.Waiting;
        public int ConnectedPlayers;
        public int AlivePlayers;
        public int RoundNumber = 1;
        public int TeamAScore;
        public int TeamBScore;
        public double ElapsedSeconds;
        public string WinningTeamId = string.Empty;
        public string CompletionReason = string.Empty;
    }
}
