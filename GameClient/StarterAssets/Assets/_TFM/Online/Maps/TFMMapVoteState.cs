using System;

namespace TFM.Online.Maps
{
    [Serializable]
    public sealed class TFMMapVoteState
    {
        public string VoteId = string.Empty;
        public string MatchId = string.Empty;
        public string ModeId = string.Empty;
        public TFMMapVoteOption[] Options = Array.Empty<TFMMapVoteOption>();
        public string SelectedMapId = string.Empty;
        public long ClosesAtUnixSeconds;
    }
}
