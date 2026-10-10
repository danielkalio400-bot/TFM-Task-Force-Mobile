namespace TFM.Authentication
{
    public enum TFMAuthenticationState
    {
        SignedOut = 0,
        BrowserAuthorizationPending = 1,
        IdentityValidated = 2,
        GameSessionIssued = 3,
        Expired = 4,
        Revoked = 5,
        Failed = 6
    }
}
