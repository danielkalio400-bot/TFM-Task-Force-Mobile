import { randomUUID } from "node:crypto";

function clean(value, max = 240) {
  const result = String(value || "").trim();
  return result && result.length <= max ? result : "";
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function rate(value) {
  return Math.min(1, Math.max(0, finite(value, 0)));
}

function positive(value) {
  return Math.max(0, finite(value, 0));
}

function relativeIncrease(current, baseline) {
  if (baseline <= 0) return current > 0 ? 1 : 0;
  return (current - baseline) / baseline;
}

export class ReleaseObservabilityService {
  #samples = [];
  #baselines = new Map();
  #reports = new Map();
  #audit = [];

  constructor(contract) {
    this.platforms = new Set(contract?.platforms || []);
    this.minimumSessions = contract?.minimumSessions || {};
    this.thresholds = contract?.thresholds || {};
    this.regressionLimits = contract?.regressionLimits || {};
  }

  ingest(input) {
    const artifactId = clean(input?.artifactId, 100);
    const platform = clean(input?.platform, 32);
    const cohort = clean(input?.cohort, 100) || "unspecified";
    const sessions = Math.max(0, Math.trunc(finite(input?.sessions, 0)));

    if (!artifactId || !this.platforms.has(platform) || sessions < 1)
      return { ok: false, error: "invalid_release_quality_sample" };

    const crashes = Math.min(sessions, Math.max(0, Math.trunc(finite(input?.crashes, 0))));
    const anrs = Math.min(sessions, Math.max(0, Math.trunc(finite(input?.anrs, 0))));

    const sample = {
      sampleId: randomUUID(),
      artifactId,
      platform,
      cohort,
      sessions,
      crashes,
      anrs,
      p50FrameMs: positive(input?.p50FrameMs),
      p95FrameMs: positive(input?.p95FrameMs),
      memoryMbP95: positive(input?.memoryMbP95),
      thermalSevereRate: rate(input?.thermalSevereRate),
      networkDisconnectRate: rate(input?.networkDisconnectRate),
      batteryDrainPctPerHour: positive(input?.batteryDrainPctPerHour),
      sourceReference: clean(input?.sourceReference, 240),
      capturedAt: clean(input?.capturedAt, 64) || new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    };

    this.#samples.push(sample);
    if (this.#samples.length > 20000) this.#samples.shift();
    this.#record("quality-sample-recorded", { artifactId, platform, cohort, sessions });
    return { ok: true, sample: structuredClone(sample) };
  }

  setBaseline(input) {
    const platform = clean(input?.platform, 32);
    const cohort = clean(input?.cohort, 100) || "all";
    if (!this.platforms.has(platform))
      return { ok: false, error: "invalid_baseline_platform" };

    const baseline = {
      platform,
      cohort,
      crashRate: rate(input?.crashRate),
      p95FrameMs: positive(input?.p95FrameMs),
      memoryMbP95: positive(input?.memoryMbP95),
      networkDisconnectRate: rate(input?.networkDisconnectRate),
      sourceArtifactId: clean(input?.sourceArtifactId, 100),
      updatedAt: new Date().toISOString(),
    };

    if (!baseline.p95FrameMs || !baseline.memoryMbP95)
      return { ok: false, error: "invalid_release_quality_baseline" };

    this.#baselines.set(this.#baselineKey(platform, cohort), baseline);
    this.#record("quality-baseline-upserted", {
      platform,
      cohort,
      sourceArtifactId: baseline.sourceArtifactId,
    });
    return { ok: true, baseline: structuredClone(baseline) };
  }

  evaluate(input) {
    const artifactId = clean(input?.artifactId, 100);
    const platform = clean(input?.platform, 32);
    const cohort = clean(input?.cohort, 100) || "";
    if (!artifactId || !this.platforms.has(platform))
      return { ok: false, error: "invalid_quality_evaluation" };

    const source = this.#samples.filter(sample =>
      sample.artifactId === artifactId &&
      sample.platform === platform &&
      (!cohort || sample.cohort === cohort)
    );

    if (!source.length)
      return { ok: false, error: "release_quality_samples_not_found" };

    const sessions = source.reduce((sum, sample) => sum + sample.sessions, 0);
    const crashes = source.reduce((sum, sample) => sum + sample.crashes, 0);
    const anrs = source.reduce((sum, sample) => sum + sample.anrs, 0);
    const weighted = field => source.reduce(
      (sum, sample) => sum + sample[field] * sample.sessions, 0
    ) / Math.max(1, sessions);

    const metrics = {
      sessions,
      crashes,
      anrs,
      crashRate: crashes / Math.max(1, sessions),
      crashFreeSessionRate: 1 - crashes / Math.max(1, sessions),
      anrRate: anrs / Math.max(1, sessions),
      p50FrameMs: weighted("p50FrameMs"),
      p95FrameMs: weighted("p95FrameMs"),
      memoryMbP95: weighted("memoryMbP95"),
      thermalSevereRate: weighted("thermalSevereRate"),
      networkDisconnectRate: weighted("networkDisconnectRate"),
      batteryDrainPctPerHour: weighted("batteryDrainPctPerHour"),
    };

    const threshold = this.thresholds[platform] || {};
    const minimumSessions = Math.max(1, Math.trunc(this.minimumSessions[platform] || 1));
    const blockingReasons = [];
    const reviewReasons = [];

    if (sessions < minimumSessions)
      blockingReasons.push(`insufficient-sessions:${sessions}/${minimumSessions}`);
    if (metrics.crashFreeSessionRate < finite(threshold.crashFreeSessionRateMin, 0))
      reviewReasons.push("crash-free-session-rate");
    if (metrics.anrRate > finite(threshold.anrRateMax, 1))
      reviewReasons.push("anr-rate");
    if (metrics.p95FrameMs > finite(threshold.p95FrameMsMax, Number.MAX_SAFE_INTEGER))
      blockingReasons.push("p95-frame-time");
    if (metrics.memoryMbP95 > finite(threshold.memoryMbP95Max, Number.MAX_SAFE_INTEGER))
      blockingReasons.push("memory-p95");
    if (metrics.thermalSevereRate > finite(threshold.thermalSevereRateMax, 1))
      blockingReasons.push("thermal-severe-rate");
    if (metrics.networkDisconnectRate > finite(threshold.networkDisconnectRateMax, 1))
      blockingReasons.push("network-disconnect-rate");
    if (metrics.batteryDrainPctPerHour > finite(threshold.batteryDrainPctPerHourMax, Number.MAX_SAFE_INTEGER))
      blockingReasons.push("battery-drain");

    const baseline = this.#getBaseline(platform, cohort);
    const regressions = [];
    if (baseline) {
      const limits = this.regressionLimits;
      if (relativeIncrease(metrics.crashRate, baseline.crashRate) >
          finite(limits.crashRateRelativeIncreaseMax, 1))
        regressions.push("crash-rate-regression");
      if (relativeIncrease(metrics.p95FrameMs, baseline.p95FrameMs) >
          finite(limits.p95FrameMsRelativeIncreaseMax, 1))
        regressions.push("frame-time-regression");
      if (relativeIncrease(metrics.memoryMbP95, baseline.memoryMbP95) >
          finite(limits.memoryMbP95RelativeIncreaseMax, 1))
        regressions.push("memory-regression");
      if (relativeIncrease(metrics.networkDisconnectRate, baseline.networkDisconnectRate) >
          finite(limits.networkDisconnectRateRelativeIncreaseMax, 1))
        regressions.push("network-regression");
    }

    reviewReasons.push(...regressions);

    let decision = "continue";
    if (blockingReasons.length) decision = "hold";
    if (reviewReasons.length) decision = "rollback-review";

    const report = {
      reportId: randomUUID(),
      artifactId,
      platform,
      cohort: cohort || "all",
      sampleCount: source.length,
      metrics,
      thresholds: structuredClone(threshold),
      baseline: baseline ? structuredClone(baseline) : null,
      blockingReasons,
      reviewReasons,
      decision,
      evaluatedAt: new Date().toISOString(),
    };

    this.#reports.set(report.reportId, report);
    this.#record("release-quality-evaluated", {
      reportId: report.reportId,
      artifactId,
      platform,
      cohort: report.cohort,
      sessions,
      decision,
      blockingCount: blockingReasons.length,
      reviewCount: reviewReasons.length,
    });

    return { ok: true, report: structuredClone(report) };
  }

  listSamples({ artifactId = "", platform = "", cohort = "", limit = 250 } = {}) {
    const max = Math.min(1000, Math.max(1, Math.trunc(Number(limit) || 250)));
    return this.#samples
      .filter(sample =>
        (!artifactId || sample.artifactId === artifactId) &&
        (!platform || sample.platform === platform) &&
        (!cohort || sample.cohort === cohort)
      )
      .slice(-max)
      .map(sample => structuredClone(sample));
  }

  listBaselines(platform = "") {
    return [...this.#baselines.values()]
      .filter(item => !platform || item.platform === platform)
      .map(item => structuredClone(item));
  }

  getReport(reportId) {
    const report = this.#reports.get(String(reportId || ""));
    return report ? structuredClone(report) : null;
  }

  audit(limit = 100) {
    const count = Math.min(500, Math.max(1, Math.trunc(Number(limit) || 100)));
    return this.#audit.slice(-count).map(event => structuredClone(event));
  }

  #baselineKey(platform, cohort) {
    return `${platform}:${cohort || "all"}`;
  }

  #getBaseline(platform, cohort) {
    return this.#baselines.get(this.#baselineKey(platform, cohort || "all")) ||
      this.#baselines.get(this.#baselineKey(platform, "all")) ||
      null;
  }

  #record(type, details) {
    this.#audit.push({
      eventId: randomUUID(),
      type,
      details: { ...details },
      recordedAt: new Date().toISOString(),
    });
    if (this.#audit.length > 5000) this.#audit.shift();
  }
}
