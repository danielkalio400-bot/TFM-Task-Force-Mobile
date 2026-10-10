using System;

namespace TFM.Performance
{
    [Serializable]
    public sealed class TFMPerformanceSample
    {
        public string DeviceProfile = string.Empty;
        public double FrameTimeMs;
        public double CpuFrameMs;
        public double GpuFrameMs;
        public long ManagedMemoryBytes;
        public long TotalMemoryBytes;
        public double ThermalLevel01;
        public long UnixMilliseconds;

        public void Normalize()
        {
            FrameTimeMs = Math.Max(0d, FrameTimeMs);
            CpuFrameMs = Math.Max(0d, CpuFrameMs);
            GpuFrameMs = Math.Max(0d, GpuFrameMs);
            ManagedMemoryBytes = Math.Max(0L, ManagedMemoryBytes);
            TotalMemoryBytes = Math.Max(0L, TotalMemoryBytes);
            ThermalLevel01 = Math.Clamp(ThermalLevel01, 0d, 1d);
        }
    }
}
