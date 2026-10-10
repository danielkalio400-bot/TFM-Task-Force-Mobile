using System;

namespace TFM.Online.Matchmaking
{
    [Serializable]
    public sealed class TFMMatchmakingAssignment
    {
        public string MatchId = string.Empty;
        public string Region = string.Empty;
        public string SectionId = string.Empty;
        public string ModeId = string.Empty;
        public string[] TicketIds = Array.Empty<string>();
        public string[] PlayerIds = Array.Empty<string>();
        public int SkillSpread;
        public long CreatedAtUnixMilliseconds;
    }
}
