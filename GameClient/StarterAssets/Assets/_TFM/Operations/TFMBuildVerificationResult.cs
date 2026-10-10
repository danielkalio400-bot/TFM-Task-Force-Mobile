using System;
using System.Collections.Generic;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMBuildVerificationResult
    {
        public string VerificationId = string.Empty;
        public string ArtifactId = string.Empty;
        public bool Passed;
        public List<string> BlockingReasons = new();
        public long VerifiedAtUnixSeconds;
    }
}
