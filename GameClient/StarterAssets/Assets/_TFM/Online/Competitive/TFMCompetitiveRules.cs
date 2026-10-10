using System;

namespace TFM.Online.Competitive
{
    public static class TFMCompetitiveRules
    {
        public static TFMCompetitiveResult Resolve(bool won, int opponentAverageRating, int playerRating)
        {
            int difference = opponentAverageRating - playerRating;
            int adjustment = Math.Clamp(difference / 100, -8, 8);
            int delta = won ? 24 + adjustment : -18 + adjustment;
            return new TFMCompetitiveResult(won, delta);
        }
    }
}
