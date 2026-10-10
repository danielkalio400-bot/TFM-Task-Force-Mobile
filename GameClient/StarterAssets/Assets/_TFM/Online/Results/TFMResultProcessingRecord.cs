using System;

namespace TFM.Online.Results
{
    [Serializable]
    public sealed class TFMResultProcessingRecord
    {
        public string MatchId = string.Empty;
        public TFMResultPipelineState State = TFMResultPipelineState.PendingValidation;
        public int PlayerCount;
        public int RewardsApplied;
        public string FailureCode = string.Empty;
    }
}
