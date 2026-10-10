import { randomUUID } from "node:crypto";

function clean(value, max = 200) {
  const result = String(value || "").trim();
  return result && result.length <= max ? result : "";
}

export class PlatformComplianceService {
  #checks = new Map();
  #reports = new Map();
  #audit = [];

  constructor(contract) {
    this.platforms = new Set(contract?.platforms || []);
    this.requiredCategories = new Set(contract?.requiredCategories || []);
  }

  upsertCheck(input) {
    const platform = clean(input?.platform, 32);
    const category = clean(input?.category, 80);
    const status = clean(input?.status || "pending", 32);
    const evidenceReference = clean(input?.evidenceReference, 240);
    if (!this.platforms.has(platform) || !category ||
        !["pending", "passed", "failed", "not-applicable"].includes(status))
      return { ok: false, error: "invalid_compliance_check" };

    if (this.requiredCategories.has(category) && status === "not-applicable")
      return { ok: false, error: "required_check_cannot_be_not_applicable" };
    if (status === "passed" && !evidenceReference)
      return { ok: false, error: "passed_check_requires_evidence" };

    const key = platform + ":" + category;
    const existing = this.#checks.get(key);
    const check = {
      checkId: existing?.checkId || randomUUID(),
      platform,
      category,
      status,
      evidenceReference,
      required: this.requiredCategories.has(category),
      updatedAt: new Date().toISOString(),
    };
    this.#checks.set(key, check);
    this.#record("compliance-check-updated", { platform, category, status });
    return { ok: true, check: { ...check } };
  }

  list(platform) {
    const id = clean(platform, 32);
    return [...this.#checks.values()]
      .filter(check => !id || check.platform === id)
      .sort((a, b) => a.category.localeCompare(b.category))
      .map(check => ({ ...check }));
  }

  evaluate(input) {
    const platform = clean(input?.platform, 32);
    const channel = clean(input?.channel || "stable", 32);
    const version = clean(input?.version, 64);
    const buildNumber = Math.max(1, Math.trunc(Number(input?.buildNumber) || 0));
    if (!this.platforms.has(platform) || !["alpha", "beta", "stable"].includes(channel) ||
        !version || buildNumber < 1)
      return { ok: false, error: "invalid_certification_candidate" };

    const checks = this.list(platform);
    const blockingChecks = [...this.requiredCategories]
      .filter(category => {
        const check = checks.find(item => item.category === category);
        return !check || check.status !== "passed" || !check.evidenceReference;
      });

    const report = {
      reportId: randomUUID(),
      platform,
      channel,
      version,
      buildNumber,
      state: blockingChecks.length ? "blocked" : "candidate",
      blockingChecks,
      evaluatedAt: new Date().toISOString(),
    };
    this.#reports.set(report.reportId, report);
    this.#record("release-certification-evaluated", {
      platform,
      version,
      buildNumber,
      state: report.state,
      blockingCount: blockingChecks.length,
    });
    return { ok: true, report: structuredClone(report) };
  }

  getReport(reportId) {
    const report = this.#reports.get(String(reportId || ""));
    return report ? structuredClone(report) : null;
  }

  audit(limit = 100) {
    const count = Math.min(500, Math.max(1, Math.trunc(Number(limit) || 100)));
    return this.#audit.slice(-count).map(event => structuredClone(event));
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
