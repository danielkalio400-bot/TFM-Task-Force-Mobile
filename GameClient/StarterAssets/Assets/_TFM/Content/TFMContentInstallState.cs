using System;

namespace TFM.Content
{
    [Serializable]
    public sealed class TFMContentInstallState
    {
        public string PackId = string.Empty;
        public string InstalledVersion = string.Empty;
        public TFMContentPackState State = TFMContentPackState.NotInstalled;
        public long DownloadedBytes;
        public long TotalBytes;
        public string FailureCode = string.Empty;

        public float Progress01 =>
            TotalBytes <= 0L ? (State == TFMContentPackState.Installed ? 1f : 0f) :
            (float)Math.Clamp((double)DownloadedBytes / TotalBytes, 0d, 1d);

        public void Normalize()
        {
            DownloadedBytes = Math.Max(0L, DownloadedBytes);
            TotalBytes = Math.Max(0L, TotalBytes);
            if (TotalBytes > 0L) DownloadedBytes = Math.Min(DownloadedBytes, TotalBytes);
        }
    }
}
