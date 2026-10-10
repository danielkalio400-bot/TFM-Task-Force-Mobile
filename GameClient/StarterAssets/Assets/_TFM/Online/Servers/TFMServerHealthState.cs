namespace TFM.Online.Servers
{
    public enum TFMServerHealthState
    {
        Unknown = 0,
        Starting = 1,
        Ready = 2,
        Degraded = 3,
        Draining = 4,
        Offline = 5
    }
}
