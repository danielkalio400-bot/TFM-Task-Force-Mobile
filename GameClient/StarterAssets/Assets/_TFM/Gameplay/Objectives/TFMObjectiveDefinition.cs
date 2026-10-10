using System;

namespace TFM.Gameplay.Objectives
{
    [Serializable]
    public sealed class TFMObjectiveDefinition
    {
        public string ObjectiveId = string.Empty;
        public string DisplayName = string.Empty;
        public float TargetProgress = 100f;
        public bool Repeatable;

        public void Normalize()
        {
            if (TargetProgress <= 0f) TargetProgress = 1f;
        }
    }
}
