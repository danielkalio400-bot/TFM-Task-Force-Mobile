using System;

namespace TFM.Networking
{
    [Serializable]
    public sealed class TFMReconnectPolicy
    {
        public int MaximumAttempts = 4;
        public float InitialDelaySeconds = 1f;
        public float MaximumDelaySeconds = 8f;
        public float RecoveryWindowSeconds = 120f;

        public float DelayForAttempt(int attempt)
        {
            int safeAttempt = Math.Max(0, attempt);
            double delay = InitialDelaySeconds * Math.Pow(2d, safeAttempt);
            return (float)Math.Min(MaximumDelaySeconds, Math.Max(0d, delay));
        }
    }
}
