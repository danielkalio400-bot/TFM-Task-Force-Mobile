using System;

namespace TFM.Governance
{
    [Serializable]
    public sealed class TFMDeviceValidationProfile
    {
        public string ProfileId = string.Empty;
        public string Platform = string.Empty;
        public string DeviceClass = string.Empty;
        public string BuildId = string.Empty;
        public double AverageFps;
        public long PeakMemoryBytes;
        public bool PhysicalDeviceTested;
        public bool Passed;
    }
}
