export class PerformanceTelemetryService {
  #samples = [];

  record(input) {
    const sample = {
      deviceProfile: String(input?.deviceProfile || "unknown").slice(0, 64),
      frameTimeMs: Math.max(0, Number(input?.frameTimeMs) || 0),
      cpuFrameMs: Math.max(0, Number(input?.cpuFrameMs) || 0),
      gpuFrameMs: Math.max(0, Number(input?.gpuFrameMs) || 0),
      roundTripMs: Math.max(0, Number(input?.roundTripMs) || 0),
      jitterMs: Math.max(0, Number(input?.jitterMs) || 0),
      packetLoss01: Math.max(0, Math.min(1, Number(input?.packetLoss01) || 0)),
      thermalLevel01: Math.max(0, Math.min(1, Number(input?.thermalLevel01) || 0)),
      recordedAt: new Date().toISOString(),
    };

    this.#samples.push(sample);
    if (this.#samples.length > 1000) this.#samples.shift();
    return { ok: true, sample: { ...sample } };
  }

  summary() {
    if (this.#samples.length === 0) return { samples: 0 };

    const average = key => this.#samples.reduce((sum, sample) => sum + sample[key], 0) / this.#samples.length;
    return {
      samples: this.#samples.length,
      averageFrameTimeMs: average("frameTimeMs"),
      averageRoundTripMs: average("roundTripMs"),
      averageJitterMs: average("jitterMs"),
      averagePacketLoss01: average("packetLoss01"),
      averageThermalLevel01: average("thermalLevel01"),
    };
  }
}
