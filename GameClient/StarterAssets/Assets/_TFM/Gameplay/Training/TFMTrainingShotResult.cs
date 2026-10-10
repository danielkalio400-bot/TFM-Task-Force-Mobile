using TFM.Gameplay.Combat;

namespace TFM.Gameplay.Training
{
    // Local shot observations are for the training range only and must
    // never authorize online statistics, unlocks or persistent rewards.
    public readonly struct TFMTrainingShotResult
    {
        public readonly TFMTargetDummy Target;
        public readonly bool Hit;
        public readonly bool TargetCleared;
        public readonly int RemainingAmmo;

        public TFMTrainingShotResult(TFMTargetDummy target, bool hit,
            bool targetCleared, int remainingAmmo)
        {
            Target = target;
            Hit = hit;
            TargetCleared = targetCleared;
            RemainingAmmo = remainingAmmo;
        }
    }
}
