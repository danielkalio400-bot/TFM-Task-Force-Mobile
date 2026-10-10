namespace TFM.Telemetry
{
    public interface ITFMTelemetrySink
    {
        void Record(TFMTelemetryEvent telemetryEvent);
        void Flush();
    }
}
