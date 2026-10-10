using System;

namespace TFM.Authentication
{
    public interface ITFMIdentityFlow
    {
        TFMAuthenticationState State { get; }
        event Action<TFMAuthenticationState> StateChanged;
        void BeginSystemBrowserSignIn();
        void HandleRedirect(string redirectUri);
        void SignOut();
    }
}
