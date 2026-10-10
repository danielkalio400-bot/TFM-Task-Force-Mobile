using System;

namespace TFM.Performance
{
    [Serializable]
    public sealed class TFMProductionTelemetryGate
    {
        public string Platform = string.Empty;
        public double MaximumAverageFrameTimeMs = 33.34d;
        public double MaximumAverageRoundTripMs = 180d;
        public double MaximumAveragePacketLoss01 = 0.03d;
        public double MaximumAverageThermalLevel01 = 0.8d;

        public bool Passes(
            double averageFrameTimeMs,
            double averageRoundTripMs,
            double averagePacketLoss01,
            double averageThermalLevel01)
        {
            return averageFrameTimeMs <= MaximumAverageFrameTimeMs &&
                   averageRoundTripMs <= MaximumAverageRoundTripMs &&
                   averagePacketLoss01 <= MaximumAveragePacketLoss01 &&
                   averageThermalLevel01 <= MaximumAverageThermalLevel01;
        }
    }
}
