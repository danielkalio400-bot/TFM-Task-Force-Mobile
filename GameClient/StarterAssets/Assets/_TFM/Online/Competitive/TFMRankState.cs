using System;

namespace TFM.Online.Competitive
{
    [Serializable]
    public sealed class TFMRankState
    {
        public string SeasonId = string.Empty;
        public int Rating;
        public int MatchesPlayed;
        public int Wins;
        public int Losses;

        public TFMRankTier Tier => ResolveTier(Rating);

        public static TFMRankTier ResolveTier(int rating)
        {
            if (rating >= 6000) return TFMRankTier.Elite;
            if (rating >= 4500) return TFMRankTier.Master;
            if (rating >= 3500) return TFMRankTier.Diamond;
            if (rating >= 2500) return TFMRankTier.Platinum;
            if (rating >= 1600) return TFMRankTier.Gold;
            if (rating >= 900) return TFMRankTier.Silver;
            if (rating >= 300) return TFMRankTier.Bronze;
            return TFMRankTier.Recruit;
        }

        public void Normalize()
        {
            Rating = Math.Max(0, Rating);
            MatchesPlayed = Math.Max(0, MatchesPlayed);
            Wins = Math.Clamp(Wins, 0, MatchesPlayed);
            Losses = Math.Clamp(Losses, 0, MatchesPlayed);
        }
    }
}
