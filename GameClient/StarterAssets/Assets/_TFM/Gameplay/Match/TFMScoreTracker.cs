using System;
using System.Collections.Generic;

namespace TFM.Gameplay.Match
{
    public sealed class TFMScoreTracker
    {
        private readonly Dictionary<string, int> _teamScores = new Dictionary<string, int>();
        private readonly Dictionary<string, int> _playerScores = new Dictionary<string, int>();

        public event Action<TFMScoreEvent> ScoreChanged;

        public int TeamScore(string teamId)
        {
            return teamId != null && _teamScores.TryGetValue(teamId, out int score) ? score : 0;
        }

        public int PlayerScore(string playerId)
        {
            return playerId != null && _playerScores.TryGetValue(playerId, out int score) ? score : 0;
        }

        public void Add(TFMScoreEvent scoreEvent)
        {
            if (scoreEvent.Points <= 0) return;

            if (!string.IsNullOrEmpty(scoreEvent.TeamId))
            {
                _teamScores[scoreEvent.TeamId] = TeamScore(scoreEvent.TeamId) + scoreEvent.Points;
            }

            if (!string.IsNullOrEmpty(scoreEvent.PlayerId))
            {
                _playerScores[scoreEvent.PlayerId] = PlayerScore(scoreEvent.PlayerId) + scoreEvent.Points;
            }

            ScoreChanged?.Invoke(scoreEvent);
        }

        public void Clear()
        {
            _teamScores.Clear();
            _playerScores.Clear();
        }
    }
}
