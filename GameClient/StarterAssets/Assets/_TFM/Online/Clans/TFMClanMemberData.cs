using System;

namespace TFM.Online.Clans
{
    [Serializable]
    public sealed class TFMClanMemberData
    {
        public string PlayerId = string.Empty;
        public string DisplayName = string.Empty;
        public TFMClanMemberRole Role;
    }
}
