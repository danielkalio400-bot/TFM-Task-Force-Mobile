using System;

namespace TFM.Identity
{
    [Serializable]
    public sealed class TFMValidatedIdentityClaims
    {
        public string Issuer = string.Empty;
        public string Audience = string.Empty;
        public string Subject = string.Empty;
        public string DisplayName = string.Empty;
        public long ExpiresAtUnixSeconds;
        public bool SignatureValidated;
    }
}
