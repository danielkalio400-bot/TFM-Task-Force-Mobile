using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMDeploymentRevision
    {
        public string DeploymentId = string.Empty;
        public string Service = string.Empty;
        public string Region = string.Empty;
        public string Version = string.Empty;
        public string PreviousVersion = string.Empty;
        public string State = "candidate";
        public long CreatedAtUnixSeconds;
    }
}
