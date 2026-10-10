using System;

namespace TFM.Gameplay.Match
{
    [Serializable]
    public sealed class TFMMatchRules
    {
        public bool friendlyFire;
        public int scoreToWin = 50;
        public float matchDurationSeconds = 600f;
        public float respawnDelaySeconds = 3f;

        public void Normalize()
        {
            scoreToWin = Math.Max(1, scoreToWin);
            matchDurationSeconds = Math.Max(30f, matchDurationSeconds);
            respawnDelaySeconds = Math.Max(0f, respawnDelaySeconds);
        }
    }
}
