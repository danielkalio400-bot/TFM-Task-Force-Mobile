using System;

namespace TFM.Gameplay.Extraction
{
    [Serializable]
    public sealed class TFMExtractionContract
    {
        public string ContractId = string.Empty;
        public string DisplayName = string.Empty;
        public string ObjectiveType = string.Empty;
        public string RegionId = string.Empty;
        public TFMExtractionContractState State = TFMExtractionContractState.Available;
        public int RequiredProgress = 1;
        public int Progress;
        public long ExpiresAtUnixSeconds;

        public void Normalize()
        {
            RequiredProgress = Math.Max(1, RequiredProgress);
            Progress = Math.Clamp(Progress, 0, RequiredProgress);
        }

        public bool IsComplete
        {
            get
            {
                Normalize();
                return Progress >= RequiredProgress;
            }
        }
    }
}
