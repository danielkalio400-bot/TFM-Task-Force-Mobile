using System;

namespace TFM.Networking
{
    [Serializable]
    public sealed class TFMNetworkQualitySample
    {
        public double RoundTripMs;
        public double JitterMs;
        public double PacketLoss01;
        public double ReceiveKbps;
        public double SendKbps;
        public long UnixMilliseconds;

        public void Normalize()
        {
            RoundTripMs = Math.Max(0d, RoundTripMs);
            JitterMs = Math.Max(0d, JitterMs);
            PacketLoss01 = Math.Clamp(PacketLoss01, 0d, 1d);
            ReceiveKbps = Math.Max(0d, ReceiveKbps);
            SendKbps = Math.Max(0d, SendKbps);
        }
    }
}
