using System;

namespace TFM.Online.Friends
{
    [Serializable]
    public sealed class TFMFriendEntry
    {
        public string PlayerId = string.Empty;
        public string DisplayName = string.Empty;
        public TFMFriendRelationship Relationship;
        public bool Online;
        public string Presence = string.Empty;
    }
}
