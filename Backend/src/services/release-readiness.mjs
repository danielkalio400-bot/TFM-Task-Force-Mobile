export class ReleaseReadinessService {
  evaluate(input) {
    const platform = String(input?.platform || "").trim();
    if (!["android", "ios", "windows"].includes(platform))
      return { ok: false, error: "invalid_release_platform" };

    const gates = {
      coreContentReady: Boolean(input?.coreContentReady),
      selectedMapsReady: Boolean(input?.selectedMapsReady),
      backendHealthReady: Boolean(input?.backendHealthReady),
      recoveryReady: Boolean(input?.recoveryReady),
      performanceReady: Boolean(input?.performanceReady),
      qaReady: Boolean(input?.qaReady),
    };

    const blockers = Object.entries(gates)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    return {
      ok: true,
      report: {
        buildId: String(input?.buildId || "dev").slice(0, 80),
        platform,
        state: blockers.length ? "blocked" : "candidate",
        ...gates,
        blockingReasons: blockers,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }
}
