using System;

namespace TFM.Online.Servers
{
    [Serializable]
    public sealed class TFMServerAllocationData
    {
        public string allocationId = "";
        public string matchId = "";
        public string region = "";
        public string state = "pending";
        public string connectionToken = "";
    }
}
