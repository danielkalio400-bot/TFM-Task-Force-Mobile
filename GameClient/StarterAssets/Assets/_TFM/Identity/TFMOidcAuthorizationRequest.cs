using System;

namespace TFM.Identity
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

        public bool IsValid() =>
            !string.IsNullOrWhiteSpace(AuthorizationEndpoint) &&
            !string.IsNullOrWhiteSpace(ClientId) &&
            !string.IsNullOrWhiteSpace(RedirectUri) &&
            !string.IsNullOrWhiteSpace(State) &&
            !string.IsNullOrWhiteSpace(CodeChallenge);
    }
}
