using System;

namespace TFM.Online.Sections
{
    [Serializable]
    public sealed class TFMSectionSessionState
    {
        public string SessionId = string.Empty;
        public string SectionId = string.Empty;
        public string RuntimeId = string.Empty;
        public string MapId = string.Empty;
        public string ModeId = string.Empty;
        public string Region = string.Empty;
        public string ServerId = string.Empty;
        public bool Recoverable;
    }
}
