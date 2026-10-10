using System;

namespace TFM.Online.Party
{
    [Serializable]
    public sealed class TFMPartyState
    {
        public string PartyId = string.Empty;
        public string LeaderPlayerId = string.Empty;
        public int MaximumMembers = 4;
        public TFMPartyMember[] Members = Array.Empty<TFMPartyMember>();

        public int AverageSkillRating()
        {
            if (Members == null || Members.Length == 0) return 0;
            long total = 0;
            foreach (var member in Members)
            {
                total += Math.Max(0, member?.SkillRating ?? 0);
            }
            return (int)(total / Members.Length);
        }
    }
}
