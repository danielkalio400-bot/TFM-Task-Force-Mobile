using System;

namespace TFM.Authentication
{
    [Serializable]
    public sealed class TFMGameSessionCredential
    {
        public string SessionId = string.Empty;
        public string PlayerId = string.Empty;
        public string AccessToken = string.Empty;
        public long ExpiresAtUnixSeconds;

        public bool IsExpired(long nowUnixSeconds) =>
            string.IsNullOrWhiteSpace(AccessToken) || nowUnixSeconds >= ExpiresAtUnixSeconds;

        public void Clear()
        {
            SessionId = string.Empty;
            PlayerId = string.Empty;
            AccessToken = string.Empty;
            ExpiresAtUnixSeconds = 0;
        }
    }
}
