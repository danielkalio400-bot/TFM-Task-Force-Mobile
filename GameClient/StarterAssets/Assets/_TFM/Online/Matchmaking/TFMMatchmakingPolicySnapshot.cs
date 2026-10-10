using System;

namespace TFM.Online.Matchmaking
{
    [Serializable]
    public sealed class TFMMatchmakingPolicySnapshot
    {
        public int MaximumSearchSeconds = 120;
        public int InitialSkillDelta = 100;
        public int MaximumSkillDelta = 600;
        public int SkillExpansionPer30Seconds = 150;
        public bool PreservePartyIntegrity = true;
        public bool RequireSharedRegion = true;
    }
}
