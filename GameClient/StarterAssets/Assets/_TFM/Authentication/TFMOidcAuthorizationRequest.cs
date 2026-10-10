using System;

namespace TFM.Authentication
{
    [Serializable]
    public sealed class TFMOidcAuthorizationRequest
    {
        public string AuthorizationEndpoint = string.Empty;
        public string ClientId = string.Empty;
        public string RedirectUri = string.Empty;
        public string Scope = "openid profile";
        public string State = string.Empty;
        public string CodeChallenge = string.Empty;
        public string CodeChallengeMethod = "S256";
    }
}
