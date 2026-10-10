export class TelemetryGateService {
  constructor(contract) {
    this.contract = contract;
  }

  evaluate(input) {
    const platform = String(input?.platform || "").trim();
    const gate = this.contract.platformDefaults[platform];
    if (!gate) return { ok: false, error: "invalid_telemetry_platform" };

    const metrics = {
      averageFrameTimeMs: Math.max(0, Number(input?.averageFrameTimeMs) || 0),
      averageRoundTripMs: Math.max(0, Number(input?.averageRoundTripMs) || 0),
      averagePacketLoss01: Math.max(0, Math.min(1, Number(input?.averagePacketLoss01) || 0)),
      averageThermalLevel01: Math.max(0, Math.min(1, Number(input?.averageThermalLevel01) || 0)),
    };

    const failures = [];
    if (metrics.averageFrameTimeMs > gate.maximumAverageFrameTimeMs) failures.push("frame-time");
    if (metrics.averageRoundTripMs > gate.maximumAverageRoundTripMs) failures.push("round-trip");
    if (metrics.averagePacketLoss01 > gate.maximumAveragePacketLoss01) failures.push("packet-loss");
    if (metrics.averageThermalLevel01 > gate.maximumAverageThermalLevel01) failures.push("thermal");

    return {
      ok: true,
      report: {
        platform,
        state: failures.length ? "blocked" : "passed",
        metrics,
        thresholds: { ...gate },
        failures,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }
}
