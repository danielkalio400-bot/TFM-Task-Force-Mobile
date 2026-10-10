using System;

namespace TFM.Moderation
{
    [Serializable]
    public sealed class TFMPlayerReport
    {
        public string ReportId = string.Empty;
        public string ReporterPlayerId = string.Empty;
        public string ReportedPlayerId = string.Empty;
        public string MatchId = string.Empty;
        public TFMReportCategory Category;
        public string Note = string.Empty;
        public long CreatedAtUnixSeconds;
    }
}
