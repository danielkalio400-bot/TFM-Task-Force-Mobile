using System;

namespace TFM.Online.Objectives
{
    // Runtime result from the trusted server session issuer. Do not serialize
    // these secrets into save files, Unity scenes or analytics.
    [Serializable]
    public sealed class TFMObjectiveSessionCredentials
    {
        public string viewerToken;
        public string reconnectToken;
        public long expiresInMs;
        public TFMServerObjectiveSnapshot snapshot;
        public long nextSequence;
        public bool resyncRequired;

        public void ClearSecrets()
        {
            viewerToken = null;
            reconnectToken = null;
        }
    }
}
