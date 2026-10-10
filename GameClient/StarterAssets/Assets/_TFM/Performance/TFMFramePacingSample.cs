using System;

namespace TFM.Performance
{
    [Serializable]
    public sealed class TFMFramePacingSample
    {
        public int RequestedFrameRate;
        public float ObservedFrameRate;
        public float AverageFrameMilliseconds;
        public float SlowFrameFraction;
        public int SampleCount;
        public float RenderScale;
        public string DeviceClass;
        public bool SustainedTargetMet;

        public override string ToString()
        {
            return string.Format("{0} target / {1:0.0} measured FPS, {2:0.0}% slow",
                RequestedFrameRate, ObservedFrameRate, SlowFrameFraction * 100f);
        }
    }
}
