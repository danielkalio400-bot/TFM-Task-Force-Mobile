using System;
using System.Collections.Generic;

namespace TFM.Telemetry
{
    [Serializable]
    public sealed class TFMTelemetryEvent
    {
        public string EventName = string.Empty;
        public string SessionId = string.Empty;
        public string MatchId = string.Empty;
        public long UnixMilliseconds;
        public Dictionary<string, string> Properties = new();
    }
}
