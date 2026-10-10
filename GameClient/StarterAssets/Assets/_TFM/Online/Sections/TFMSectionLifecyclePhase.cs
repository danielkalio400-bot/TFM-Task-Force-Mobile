namespace TFM.Online.Sections
{
    public enum TFMSectionLifecyclePhase
    {
        Idle = 0,
        CheckingContent = 1,
        CheckingMap = 2,
        CreatingSession = 3,
        AllocatingServer = 4,
        Connecting = 5,
        Active = 6,
        Recovering = 7,
        Results = 8,
        Returning = 9,
        Failed = 10
    }
}
