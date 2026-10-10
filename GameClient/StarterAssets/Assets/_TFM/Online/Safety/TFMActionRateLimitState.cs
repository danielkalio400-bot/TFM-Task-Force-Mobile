using System;

namespace TFM.Online.Safety
{
    [Serializable]
    public sealed class TFMActionRateLimitState
    {
        public string PlayerId = string.Empty;
        public string ActionKey = string.Empty;
        public int Limit;
        public int Used;
        public long WindowEndsAtUnixSeconds;

        public int Remaining => Math.Max(0, Limit - Used);
    }
}
