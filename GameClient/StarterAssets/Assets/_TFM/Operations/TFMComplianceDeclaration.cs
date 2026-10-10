using System;

namespace TFM.Operations
{
    [Serializable]
    public sealed class TFMComplianceDeclaration
    {
        public string DeclarationId = string.Empty;
        public string Platform = string.Empty;
        public bool PrivacyDisclosureReady;
        public bool DataSafetyDisclosureReady;
        public bool AccountDeletionFlowReady;
        public bool AccessibilityReviewReady;
        public bool ContentRatingQuestionnaireReady;
        public bool PermissionsReviewReady;
        public bool SupportContactReady;
    }
}
