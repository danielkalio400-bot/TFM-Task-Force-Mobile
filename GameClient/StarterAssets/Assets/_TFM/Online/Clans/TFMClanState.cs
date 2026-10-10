using System;
using System.Collections.Generic;

namespace TFM.Online.Clans
{
    [Serializable]
    public sealed class TFMClanState
    {
        public string ClanId = string.Empty;
        public string Name = string.Empty;
        public string Tag = string.Empty;
        public TFMClanPrivacy Privacy = TFMClanPrivacy.RequestToJoin;
        public List<TFMClanMemberData> Members = new();
        public int MemberLimit = 50;
        public bool RecruitmentEnabled = true;
    }
}
