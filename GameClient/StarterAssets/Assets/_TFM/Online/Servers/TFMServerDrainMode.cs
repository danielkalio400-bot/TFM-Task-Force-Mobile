namespace TFM.Online.Servers
{
    public enum TFMServerDrainMode
    {
        None = 0,
        StopNewAssignments = 1,
        FinishCurrentMatches = 2,
        ImmediateMaintenance = 3
    }
}
