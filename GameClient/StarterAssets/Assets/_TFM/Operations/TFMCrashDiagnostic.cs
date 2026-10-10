using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMCrashDiagnostic
    {
        public string DiagnosticId = string.Empty;
        public string Service = string.Empty;
        public string Region = string.Empty;
        public string BuildId = string.Empty;
        public string Signature = string.Empty;
        public int OccurrenceCount;
        public long FirstSeenUnixSeconds;
        public long LastSeenUnixSeconds;
    }
}
