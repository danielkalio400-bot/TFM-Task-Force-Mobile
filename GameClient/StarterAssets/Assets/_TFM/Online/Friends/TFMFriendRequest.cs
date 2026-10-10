using System;

namespace TFM.Online.Friends
{
    [Serializable]
    public sealed class TFMFriendRequest
    {
        public string RequestId = string.Empty;
        public string SenderPlayerId = string.Empty;
        public string RecipientPlayerId = string.Empty;
        public TFMFriendRequestState State = TFMFriendRequestState.Pending;
        public long CreatedAtUnixSeconds;
        public long UpdatedAtUnixSeconds;
    }
}
