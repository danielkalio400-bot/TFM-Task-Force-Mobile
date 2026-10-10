using System;

namespace TFM.Content
{
    [Serializable]
    public sealed class TFMDeliveryPackage
    {
        public string PackageId = string.Empty;
        public string PackId = string.Empty;
        public string Version = string.Empty;
        public long SizeBytes;
        public string IntegrityTag = string.Empty;
        public TFMDeliveryPackageState State = TFMDeliveryPackageState.Unknown;
        public long DownloadedBytes;

        public float Progress01 =>
            SizeBytes <= 0L ? (State == TFMDeliveryPackageState.Ready ? 1f : 0f) :
            (float)Math.Clamp((double)DownloadedBytes / SizeBytes, 0d, 1d);

        public void Normalize()
        {
            SizeBytes = Math.Max(0L, SizeBytes);
            DownloadedBytes = Math.Clamp(DownloadedBytes, 0L, SizeBytes);
        }
    }
}
