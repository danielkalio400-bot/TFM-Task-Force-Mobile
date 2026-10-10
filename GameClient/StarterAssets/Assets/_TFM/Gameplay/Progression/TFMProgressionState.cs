using System;

namespace TFM.Gameplay.Progression
{
    [Serializable]
    public sealed class TFMProgressionState
    {
        public long TotalExperience;
        public int SoftCredits;

        public int Level => TFMProgressionRules.ResolveLevel(TotalExperience);

        public void Apply(TFMRewardGrant reward)
        {
            checked
            {
                TotalExperience += reward.Experience;
                SoftCredits += reward.Credits;
            }
        }

        public bool TrySpendCredits(int amount)
        {
            if (amount <= 0 || SoftCredits < amount) return false;
            SoftCredits -= amount;
            return true;
        }

        public void Normalize()
        {
            TotalExperience = Math.Max(0L, TotalExperience);
            SoftCredits = Math.Max(0, SoftCredits);
        }
    }
}
