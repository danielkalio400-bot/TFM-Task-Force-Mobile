using System;

namespace TFM.Online.Matchmaking
{
    [Serializable]
    public sealed class TFMMatchmakingSearchTicket
    {
        public string TicketId = string.Empty;
        public string PartyId = string.Empty;
        public string SectionId = string.Empty;
        public string ModeId = string.Empty;
        public string Platform = string.Empty;
        public string[] PreferredRegions = Array.Empty<string>();
        public int PartySize = 1;
        public int SkillRating;
        public bool AllowCrossPlatform = true;
        public long CreatedAtUnixMilliseconds;
        public long ExpiresAtUnixMilliseconds;
        public string State = "searching";
    }
}
