using System;

namespace TFM.Online.Party
{
    [Serializable]
    public sealed class TFMPartyMember
    {
        public string PlayerId = string.Empty;
        public string Platform = string.Empty;
        public TFMPartyMemberRole Role;
        public int SkillRating;
        public bool Ready;
    }
}
