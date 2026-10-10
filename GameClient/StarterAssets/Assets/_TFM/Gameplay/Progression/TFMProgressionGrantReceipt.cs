using System;

namespace TFM.Gameplay.Progression
{
    [Serializable]
    public sealed class TFMProgressionGrantReceipt
    {
        public string GrantId = string.Empty;
        public string PlayerId = string.Empty;
        public string SourceType = string.Empty;
        public string SourceId = string.Empty;
        public int Experience;
        public int SoftCredits;
        public long GrantedAtUnixSeconds;
    }
}
