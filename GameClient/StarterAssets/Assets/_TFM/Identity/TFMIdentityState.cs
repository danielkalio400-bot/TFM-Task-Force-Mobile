namespace TFM.Identity
{
    public enum TFMIdentityState
    {
        SignedOut = 0,
        LaunchingSystemBrowser = 1,
        WaitingForCallback = 2,
        ValidatingIdentity = 3,
        LinkingProfile = 4,
        IssuingGameSession = 5,
        SignedIn = 6,
        ReauthRequired = 7,
        Failed = 8
    }
}
