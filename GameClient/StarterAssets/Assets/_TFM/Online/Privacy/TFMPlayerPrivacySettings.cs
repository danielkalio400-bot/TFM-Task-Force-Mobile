using System;

namespace TFM.Online.Privacy
{
    [Serializable]
    public sealed class TFMPlayerPrivacySettings
    {
        public string PlayerId = string.Empty;
        public TFMProfileVisibility ProfileVisibility = TFMProfileVisibility.Friends;
        public bool ShowOnlineStatus = true;
        public bool AllowFriendRequests = true;
        public bool AllowClanInvites = true;
        public bool AllowPartyInvitesFromFriends = true;
        public bool AllowPartyInvitesFromClan = true;
        public bool AllowDirectMessagesFromFriends = true;
        public bool AllowDirectMessagesFromClan = true;
    }
}
