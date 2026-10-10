using System;

namespace TFM.Online.Matchmaking
{
    [Serializable]
    public sealed class TFMMatchDescriptor
    {
        public string matchId = "";
        public string sectionId = "";
        public string playlist = "";
        public string region = "";
        public string[] playerIds = Array.Empty<string>();
        public string state = "forming";
    }
}
