using System;

namespace TFM.Gameplay.Modes
{
    [Serializable]
    public sealed class TFMModeDescriptor
    {
        public string ModeId = string.Empty;
        public string DisplayName = string.Empty;
        public TFMModeCategory Category;
        public int MinimumPlayers = 2;
        public int MaximumPlayers = 10;
        public bool RankedEligible;
        public bool SupportsPrivateMatch = true;
        public bool SupportsBots;
        public bool SupportsJoinInProgress;
    }
}
