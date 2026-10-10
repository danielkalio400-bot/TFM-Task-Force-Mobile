using System;

namespace TFM.Online.Leaderboards
{
    [Serializable]
    public sealed class TFMProgressionLeaderboardEntry
    {
        public int Rank;
        public string PlayerId = string.Empty;
        public int Level;
        public long TotalExperience;
    }
}
