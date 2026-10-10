using System;
namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMReleaseQualityDecision
    {
        public string ReportId = string.Empty;
        public string ArtifactId = string.Empty;
        public string Platform = string.Empty;
        public string Cohort = string.Empty;
        public int SampleCount;
        public int Sessions;
        public string Decision = string.Empty;
        public string[] BlockingReasons = Array.Empty<string>();
        public string[] ReviewReasons = Array.Empty<string>();
        public string EvaluatedAt = string.Empty;
    }
}
