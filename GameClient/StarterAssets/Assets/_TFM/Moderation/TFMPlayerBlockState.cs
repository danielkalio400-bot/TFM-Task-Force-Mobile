using System;

namespace TFM.Moderation
{
    [Serializable]
    public sealed class TFMPlayerBlockState
    {
        public string PlayerId = string.Empty;
        public string BlockedPlayerId = string.Empty;
        public long CreatedAtUnixSeconds;
    }
}
