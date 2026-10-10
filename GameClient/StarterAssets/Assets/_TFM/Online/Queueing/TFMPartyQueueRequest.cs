using System;

namespace TFM.Online.Queueing
{
    [Serializable]
    public sealed class TFMPartyQueueRequest
    {
        public string PartyId = string.Empty;
        public string LeaderPlayerId = string.Empty;
        public string ModeId = string.Empty;
        public string Region = string.Empty;
        public int PartySize = 1;
        public int AverageSkillRating;
        public bool Ranked;
    }
}
