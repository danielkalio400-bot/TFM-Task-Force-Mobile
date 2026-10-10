using System;
namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMReleaseQualitySample
    {
        public string SampleId = string.Empty;
        public string ArtifactId = string.Empty;
        public string Platform = string.Empty;
        public string Cohort = string.Empty;
        public int Sessions;
        public int Crashes;
        public int Anrs;
        public float P50FrameMs;
        public float P95FrameMs;
        public float MemoryMbP95;
        public float ThermalSevereRate;
        public float NetworkDisconnectRate;
        public float BatteryDrainPctPerHour;
        public string SourceReference = string.Empty;
        public string CapturedAt = string.Empty;
    }
}
