namespace TFM.Content
{
    public enum TFMContentPackState
    {
        NotInstalled = 0,
        Queued = 1,
        Downloading = 2,
        Verifying = 3,
        Installed = 4,
        Failed = 5,
        UpdateRequired = 6
    }
}
