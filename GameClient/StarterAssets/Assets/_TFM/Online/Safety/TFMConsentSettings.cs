using System;

namespace TFM.Online.Safety
{
    [Serializable]
    public sealed class TFMConsentSettings
    {
        public string PlayerId = string.Empty;
        public bool SocialDiscovery = true;
        public bool DirectMessages = true;
        public bool VoiceChat = true;
        public bool CrossServiceIntegration;
        public bool PersonalizedRecommendations;
        public long UpdatedAtUnixSeconds;
    }
}
