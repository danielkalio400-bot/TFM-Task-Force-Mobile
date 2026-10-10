using System;

namespace TFM.Networking
{
    public interface ITFMTransport
    {
        bool IsConnected { get; }
        event Action Connected;
        event Action<string> Disconnected;
        event Action<TFMTransportMessage> MessageReceived;

        void Connect(string endpoint, string sessionToken);
        void Send(TFMTransportMessage message);
        void Disconnect();
    }
}
