using System;

namespace TFM.Online.Competitive
{
    [Serializable]
    public readonly struct TFMCompetitiveResult
    {
        public TFMCompetitiveResult(bool won, int ratingDelta)
        {
            Won = won;
            RatingDelta = ratingDelta;
        }

        public bool Won { get; }
        public int RatingDelta { get; }
    }
}
