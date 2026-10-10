using System;

namespace TFM.Gameplay.Progression
{
    public static class TFMProgressionRules
    {
        public static long ExperienceRequiredForLevel(int level)
        {
            int safeLevel = Math.Max(1, level);
            checked
            {
                return 800L + (safeLevel - 1L) * 250L;
            }
        }

        public static int ResolveLevel(long totalExperience)
        {
            long remaining = Math.Max(0L, totalExperience);
            int level = 1;

            while (level < 1000)
            {
                long needed = ExperienceRequiredForLevel(level);
                if (remaining < needed) return level;
                remaining -= needed;
                level++;
            }

            return level;
        }
    }
}
