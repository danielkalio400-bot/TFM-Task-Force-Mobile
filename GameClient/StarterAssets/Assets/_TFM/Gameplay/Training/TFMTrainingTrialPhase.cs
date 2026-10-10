namespace TFM.Gameplay.Training
{
    // An offline practice activity, never an online match or ranked result.
    public enum TFMTrainingTrialPhase
    {
        Ready,
        Running,
        Completed,
        Expired,
        Cancelled
    }
}
