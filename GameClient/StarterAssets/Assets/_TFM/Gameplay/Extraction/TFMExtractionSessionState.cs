using System;

namespace TFM.Gameplay.Extraction
{
    [Serializable]
    public sealed class TFMExtractionSessionState
    {
        public string MatchId = string.Empty;
        public int SquadSize = 1;
        public int ActiveSquadMembers;
        public int ContractsCompleted;
        public bool ExtractionAvailable;
        public bool Extracted;
        public long SessionEndsAtUnixSeconds;

        public void Normalize()
        {
            SquadSize = Math.Clamp(SquadSize, 1, 4);
            ActiveSquadMembers = Math.Clamp(ActiveSquadMembers, 0, SquadSize);
            ContractsCompleted = Math.Max(0, ContractsCompleted);
        }
    }
}
