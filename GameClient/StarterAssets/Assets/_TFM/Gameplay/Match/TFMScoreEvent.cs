using System;

namespace TFM.Gameplay.Match
{
    [Serializable]
    public readonly struct TFMScoreEvent
    {
        public TFMScoreEvent(string teamId, string playerId, int points, TFMScoreReason reason)
        {
            TeamId = teamId ?? string.Empty;
            PlayerId = playerId ?? string.Empty;
            Points = points < 0 ? 0 : points;
            Reason = reason;
        }

        public string TeamId { get; }
        public string PlayerId { get; }
        public int Points { get; }
        public TFMScoreReason Reason { get; }
    }
}
