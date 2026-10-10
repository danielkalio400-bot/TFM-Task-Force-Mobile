using System;

namespace TFM.Profile
{
    [Serializable]
    public sealed class TFMPlayerProfileRecord
    {
        public string PlayerId = string.Empty;
        public string DisplayName = string.Empty;
        public string IdentityProvider = "BazID";
        public string SubjectReference = string.Empty;
        public long CreatedAtUnixSeconds;
        public long UpdatedAtUnixSeconds;
        public bool Disabled;
    }
}
