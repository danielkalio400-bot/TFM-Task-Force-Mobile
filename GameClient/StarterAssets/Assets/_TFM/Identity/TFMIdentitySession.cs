using System;

namespace TFM.Identity
{
    [Serializable]
    public sealed class TFMIdentitySession
    {
        public string PlayerId = string.Empty;
        public string SessionId = string.Empty;
        public string AccessToken = string.Empty;
        public long ExpiresAtUnixSeconds;
        public TFMIdentityState State = TFMIdentityState.SignedOut;

        public bool IsExpired(long nowUnixSeconds) =>
            ExpiresAtUnixSeconds > 0 && nowUnixSeconds >= ExpiresAtUnixSeconds;
    }
}
