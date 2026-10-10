using System;

namespace TFM.Gameplay.Maps
{
    [Serializable]
    public sealed class TFMMapReadinessRecord
    {
        public string MapId = string.Empty;
        public TFMMapReadinessState State = TFMMapReadinessState.ConceptOnly;
        public bool GameplayValidated;
        public bool NavigationValidated;
        public bool PerformanceValidatedMobile;
        public bool PerformanceValidatedPc;
        public bool LightingValidated;
        public bool AudioValidated;
        public bool QaValidated;
        public string LastFailureCode = string.Empty;

        public bool IsPlayablePrototype =>
            State >= TFMMapReadinessState.GameplayPrototype &&
            GameplayValidated &&
            NavigationValidated;

        public bool IsReleaseReady =>
            State >= TFMMapReadinessState.ReleaseCandidate &&
            GameplayValidated &&
            NavigationValidated &&
            PerformanceValidatedMobile &&
            PerformanceValidatedPc &&
            LightingValidated &&
            AudioValidated &&
            QaValidated;
    }
}
