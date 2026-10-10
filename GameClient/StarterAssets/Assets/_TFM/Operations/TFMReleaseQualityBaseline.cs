using System;
namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMReleaseQualityBaseline
    {
        public string Platform = string.Empty;
        public string Cohort = string.Empty;
        public float CrashRate;
        public float P95FrameMs;
        public float MemoryMbP95;
        public float NetworkDisconnectRate;
        public string SourceArtifactId = string.Empty;
        public string UpdatedAt = string.Empty;
    }
}
