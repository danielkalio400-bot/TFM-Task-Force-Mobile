namespace TFM.Networking
{
    public enum TFMSessionPhase
    {
        Offline = 0,
        Connecting = 1,
        Lobby = 2,
        AllocatingServer = 3,
        JoiningMatch = 4,
        InMatch = 5,
        Reconnecting = 6,
        Leaving = 7,
        Failed = 8
    }
}
