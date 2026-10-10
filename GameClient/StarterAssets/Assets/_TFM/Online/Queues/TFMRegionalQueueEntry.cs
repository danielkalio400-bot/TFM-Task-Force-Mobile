using System;

namespace TFM.Online.Queues
{
    [Serializable]
    public sealed class TFMRegionalQueueEntry
    {
        public string QueueEntryId = string.Empty;
        public string PlayerId = string.Empty;
        public string ModeId = string.Empty;
        public string Region = string.Empty;
        public int PartySize = 1;
        public int SkillRating;
        public TFMRegionalQueueState State = TFMRegionalQueueState.Idle;
        public long CreatedAtUnixSeconds;
    }
}
