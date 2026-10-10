using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMServiceAvailabilityState
    {
        public string Service = string.Empty;
        public string Region = string.Empty;
        public double TargetAvailability01 = 0.999d;
        public double ObservedAvailability01 = 1d;
        public string Status = "healthy";
        public long WindowStartUnixSeconds;
        public long WindowEndUnixSeconds;
    }
}
