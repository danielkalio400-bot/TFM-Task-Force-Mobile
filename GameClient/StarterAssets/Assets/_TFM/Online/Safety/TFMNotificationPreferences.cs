using System;

namespace TFM.Online.Safety
{
    [Serializable]
    public sealed class TFMNotificationPreferences
    {
        public string PlayerId = string.Empty;
        public bool Match = true;
        public bool Friend = true;
        public bool Clan = true;
        public bool Security = true;
        public bool Moderation = true;
        public bool System = true;
    }
}
