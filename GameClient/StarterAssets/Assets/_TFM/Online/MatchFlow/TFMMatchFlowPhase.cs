namespace TFM.Online.MatchFlow
{
    public enum TFMMatchFlowPhase
    {
        None = 0,
        Lobby = 1,
        Queueing = 2,
        ServerAssignment = 3,
        Connecting = 4,
        Warmup = 5,
        Active = 6,
        Results = 7,
        Returning = 8,
        Failed = 9
    }
}
