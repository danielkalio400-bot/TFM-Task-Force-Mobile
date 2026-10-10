using System;

namespace TFM.Online.Servers
{
    [Serializable]
    public sealed class TFMServerHeartbeat
    {
        public string ServerId = string.Empty;
        public string Region = string.Empty;
        public TFMServerHealthState Health = TFMServerHealthState.Unknown;
        public int PlayerCount;
        public int Capacity;
        public double CpuLoad01;
        public double MemoryLoad01;
        public long UnixMilliseconds;
    }
}
