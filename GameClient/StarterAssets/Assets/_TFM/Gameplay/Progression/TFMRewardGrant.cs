using System;

namespace TFM.Gameplay.Progression
{
    [Serializable]
    public readonly struct TFMRewardGrant
    {
        public TFMRewardGrant(long experience, int credits, string source)
        {
            Experience = Math.Max(0L, experience);
            Credits = Math.Max(0, credits);
            Source = source ?? string.Empty;
        }

        public long Experience { get; }
        public int Credits { get; }
        public string Source { get; }
    }
}
