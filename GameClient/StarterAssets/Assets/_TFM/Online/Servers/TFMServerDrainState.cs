using System;

namespace TFM.Online.Servers
{
    [Serializable]
    public sealed class TFMServerDrainState
    {
        public string ServerId = string.Empty;
        public TFMServerDrainMode Mode;
        public string ReasonCode = string.Empty;
        public long RequestedAtUnixSeconds;
    }
}
