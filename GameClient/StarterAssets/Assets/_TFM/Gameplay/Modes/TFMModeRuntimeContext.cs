using System.Collections.Generic;
using TFM.Gameplay.Match;

namespace TFM.Gameplay.Modes
{
    public sealed class TFMModeRuntimeContext
    {
        public TFMMatchRules Rules { get; set; } = new TFMMatchRules();
        public TFMScoreTracker Scores { get; set; } = new TFMScoreTracker();
        public double ElapsedSeconds { get; set; }
        public IReadOnlyList<string> TeamIds { get; set; } = new string[0];
    }
}
