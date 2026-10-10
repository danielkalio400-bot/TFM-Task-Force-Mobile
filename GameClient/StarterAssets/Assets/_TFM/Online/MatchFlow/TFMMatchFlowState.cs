using System;

namespace TFM.Online.MatchFlow
{
    [Serializable]
    public sealed class TFMMatchFlowState
    {
        public string MatchId = string.Empty;
        public string ModeId = string.Empty;
        public string Region = string.Empty;
        public string ServerId = string.Empty;
        public TFMMatchFlowPhase Phase = TFMMatchFlowPhase.None;
        public string FailureCode = string.Empty;
    }
}
