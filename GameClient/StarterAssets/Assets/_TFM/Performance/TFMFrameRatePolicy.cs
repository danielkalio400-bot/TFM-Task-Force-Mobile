using System;

namespace TFM.Performance
{
    // Engine-independent policy; the Unity adapter supplies supported display
    // refresh, observed frame pacing and device capabilities.
    public static class TFMFrameRatePolicy
    {
        // A stable refresh divisor avoids requesting a frame rate the panel
        // cannot pace evenly. The range has no arbitrary 120/144 FPS ceiling.
        public static int[] SupportedTargets(int refreshHz, int minimumFps = 30)
        {
            refreshHz = Math.Max(30, refreshHz);
            minimumFps = Math.Max(1, Math.Min(refreshHz, minimumFps));
            var results = new System.Collections.Generic.List<int>();
            for (int divisor = refreshHz; divisor >= 1; divisor--)
            {
                if (refreshHz % divisor != 0) continue;
                int rate = refreshHz / divisor;
                if (rate >= minimumFps) results.Add(rate);
            }
            if (results.Count == 0) results.Add(refreshHz);
            return results.ToArray();
        }

        public static int ChooseInitial(int refreshHz, bool mobile, TFMQualityMode mode, int userCapHz)
        {
            int ceiling = Math.Min(refreshHz, userCapHz > 0 ? userCapHz : refreshHz);
            if (mode == TFMQualityMode.BatterySaver) ceiling = Math.Min(ceiling, 30);
            else if (mode == TFMQualityMode.Balanced) ceiling = Math.Min(ceiling, 60);
            else if (mode == TFMQualityMode.Adaptive) ceiling = Math.Min(ceiling, mobile ? 30 : 60);
            return FloorSupported(refreshHz, ceiling);
        }

        public static int FloorSupported(int refreshHz, int maximumHz)
        {
            int[] candidates = SupportedTargets(refreshHz);
            int best = candidates[0];
            foreach (int candidate in candidates)
            {
                if (candidate > maximumHz) break;
                best = candidate;
            }
            return best;
        }

        public static int NextLower(int refreshHz, int current)
        {
            int[] candidates = SupportedTargets(refreshHz);
            int previous = candidates[0];
            foreach (int candidate in candidates)
            {
                if (candidate >= current) return previous;
                previous = candidate;
            }
            return previous;
        }

        public static int NextHigher(int refreshHz, int current, int maximum)
        {
            foreach (int candidate in SupportedTargets(refreshHz))
                if (candidate > current && candidate <= maximum) return candidate;
            return current;
        }

        public static int MaxPermitted(int refreshHz, TFMQualityMode mode, int userCapHz)
        {
            int upper = Math.Min(refreshHz, userCapHz > 0 ? userCapHz : refreshHz);
            if (mode == TFMQualityMode.BatterySaver) upper = Math.Min(upper, 30);
            if (mode == TFMQualityMode.Balanced) upper = Math.Min(upper, 60);
            return FloorSupported(refreshHz, upper);
        }
    }
}
