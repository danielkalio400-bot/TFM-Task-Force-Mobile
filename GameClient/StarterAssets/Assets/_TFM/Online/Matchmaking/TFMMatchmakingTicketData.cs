using System;

namespace TFM.Online.Matchmaking
{
    [Serializable]
    public sealed class TFMMatchmakingTicketData
    {
        public string ticketId = "";
        public string playerId = "";
        public string sectionId = "";
        public string playlist = "";
        public string platform = "";
        public string region = "";
        public string status = "idle";
        public string matchId = "";
    }
}
