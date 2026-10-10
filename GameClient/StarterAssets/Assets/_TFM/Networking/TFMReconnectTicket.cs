using System;

namespace TFM.Networking
{
    [Serializable]
    public sealed class TFMReconnectTicket
    {
        public string TicketId = string.Empty;
        public string MatchId = string.Empty;
        public string PlayerId = string.Empty;
        public string ServerId = string.Empty;
        public long ExpiresAtUnixSeconds;

        public bool IsExpired(long nowUnixSeconds) => nowUnixSeconds >= ExpiresAtUnixSeconds;
    }
}
