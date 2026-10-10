using System;

namespace TFM.Networking
{
    [Serializable]
    public readonly struct TFMTransportMessage
    {
        public TFMTransportMessage(string channel, byte[] payload, bool reliable)
        {
            Channel = channel ?? string.Empty;
            Payload = payload ?? Array.Empty<byte>();
            Reliable = reliable;
        }

        public string Channel { get; }
        public byte[] Payload { get; }
        public bool Reliable { get; }
    }
}
