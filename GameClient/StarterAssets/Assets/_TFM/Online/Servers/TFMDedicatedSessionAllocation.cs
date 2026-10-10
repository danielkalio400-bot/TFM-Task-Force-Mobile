using System;

namespace TFM.Online.Servers
{
    [Serializable]
    public sealed class TFMDedicatedSessionAllocation
    {
        public string AllocationId = string.Empty;
        public string MatchId = string.Empty;
        public string SectionId = string.Empty;
        public string Region = string.Empty;
        public string ServerId = string.Empty;
        public string Endpoint = string.Empty;
        public string JoinCredential = string.Empty;
        public long ExpiresAtUnixSeconds;
    }
}
