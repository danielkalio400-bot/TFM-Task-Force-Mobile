using System;

namespace TFM.Governance
{
    [Serializable]
    public sealed class TFMAssetProvenanceRecord
    {
        public string RecordId = string.Empty;
        public string AssetId = string.Empty;
        public string SourceType = string.Empty;
        public string RightsEvidenceReference = string.Empty;
        public bool OriginalOrLicensed;
        public bool Approved;
    }
}
