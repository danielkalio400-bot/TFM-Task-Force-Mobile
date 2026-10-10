using System;

namespace TFM.Authentication
{
    [Serializable]
    public sealed class TFMAccountSessionState
    {
        public string PlayerId = string.Empty;
        public string DisplayName = string.Empty;
        public TFMAuthenticationState AuthenticationState = TFMAuthenticationState.SignedOut;
        public long SessionExpiresAtUnixSeconds;

        public bool HasActiveSession(long nowUnixSeconds) =>
            AuthenticationState == TFMAuthenticationState.GameSessionIssued &&
            nowUnixSeconds < SessionExpiresAtUnixSeconds;
    }
}
