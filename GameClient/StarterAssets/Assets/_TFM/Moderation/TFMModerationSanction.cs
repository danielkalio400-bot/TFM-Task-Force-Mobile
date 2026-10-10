using System;

namespace TFM.Moderation
{
    [Serializable]
    public sealed class TFMModerationSanction
    {
        public string SanctionId = string.Empty;
        public string PlayerId = string.Empty;
        public TFMModerationSanctionType Type;
        public string ReasonCode = string.Empty;
        public long StartsAtUnixSeconds;
        public long EndsAtUnixSeconds;
        public bool Active = true;

        public bool IsActive(long nowUnixSeconds)
        {
            if (!Active) return false;
            return EndsAtUnixSeconds <= 0 || nowUnixSeconds < EndsAtUnixSeconds;
        }
    }
}
