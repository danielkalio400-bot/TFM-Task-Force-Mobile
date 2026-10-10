using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMBuildArtifactManifest
    {
        public string ArtifactId = string.Empty;
        public string Platform = string.Empty;
        public string Version = string.Empty;
        public int BuildNumber;
        public string SourceCommit = string.Empty;
        public string UnityVersion = string.Empty;
        public string ArtifactIntegrityReference = string.Empty;
        public string SigningIdentityReference = string.Empty;
        public string ContentManifestReference = string.Empty;
        public string State = "registered";
        public long RegisteredAtUnixSeconds;
    }
}
