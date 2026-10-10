using System;

namespace TFM.Content
{
    [Serializable]
    public sealed class TFMContentEntitlement
    {
        public string PlayerId = string.Empty;
        public string PackId = string.Empty;
        public TFMEntitlementState State = TFMEntitlementState.Unknown;
        public long GrantedAtUnixSeconds;
        public long ExpiresAtUnixSeconds;

        public bool IsUsable(long nowUnixSeconds)
        {
            if (State != TFMEntitlementState.Granted) return false;
            return ExpiresAtUnixSeconds <= 0 || nowUnixSeconds < ExpiresAtUnixSeconds;
        }
    }
}
