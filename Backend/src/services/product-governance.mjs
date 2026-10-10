import { randomUUID } from "node:crypto";

function clean(value, max = 240) {
  const result = String(value || "").trim();
  return result && result.length <= max ? result : "";
}

export class ProductGovernanceService {
  #risks = new Map();
  #evidence = new Map();
  #devices = new Map();
  #assets = new Map();
  #reports = new Map();
  #audit = [];

  constructor(contract) {
    this.riskCategories = new Set(contract?.riskCategories || []);
    this.maturityStages = contract?.maturityStages || [];
    this.releaseReadyRequirements = new Set(contract?.releaseReadyRequirements || []);
    for (const category of this.riskCategories) {
      this.#risks.set(category, {
        riskId: randomUUID(),
        category,
        status: "open",
        mitigationEvidenceReference: "",
        ownerTag: "",
        updatedAt: new Date().toISOString(),
      });
    }
  }

  updateRisk(input) {
    const category = clean(input?.category, 80);
    const status = clean(input?.status, 32);
    if (!this.riskCategories.has(category) ||
        !["open", "mitigating", "accepted", "closed"].includes(status))
      return { ok: false, error: "invalid_product_risk" };

    const risk = this.#risks.get(category);
    risk.status = status;
    risk.ownerTag = clean(input?.ownerTag, 80);
    risk.mitigationEvidenceReference = clean(input?.mitigationEvidenceReference, 240);
    if (status === "closed" && !risk.mitigationEvidenceReference)
      return { ok: false, error: "closed_risk_requires_evidence" };

    risk.updatedAt = new Date().toISOString();
    this.#record("risk-updated", { category, status });
    return { ok: true, risk: { ...risk } };
  }

  recordEvidence(input) {
    const requirement = clean(input?.requirement, 80);
    const evidenceReference = clean(input?.evidenceReference, 240);
    const passed = input?.passed === true;
    if (!requirement || !evidenceReference)
      return { ok: false, error: "invalid_governance_evidence" };

    const record = {
      evidenceId: randomUUID(),
      requirement,
      evidenceReference,
      passed,
      notesTag: clean(input?.notesTag, 120),
      recordedAt: new Date().toISOString(),
    };
    this.#evidence.set(requirement, record);
    this.#record("evidence-recorded", { requirement, passed });
    return { ok: true, evidence: { ...record } };
  }

  recordDeviceProfile(input) {
    const platform = clean(input?.platform, 32);
    const deviceClass = clean(input?.deviceClass, 80);
    const buildId = clean(input?.buildId, 80);
    if (!["android", "ios", "windows"].includes(platform) || !deviceClass || !buildId)
      return { ok: false, error: "invalid_device_validation_profile" };

    const averageFps = Math.max(0, Number(input?.averageFps) || 0);
    const peakMemoryBytes = Math.max(0, Math.trunc(Number(input?.peakMemoryBytes) || 0));
    const physicalDeviceTested = input?.physicalDeviceTested === true;
    const passed = physicalDeviceTested && averageFps >= 30 && peakMemoryBytes > 0;
    const profile = {
      profileId: randomUUID(),
      platform,
      deviceClass,
      buildId,
      averageFps,
      peakMemoryBytes,
      physicalDeviceTested,
      passed,
      recordedAt: new Date().toISOString(),
    };
    this.#devices.set(profile.profileId, profile);
    this.#record("device-profile-recorded", { platform, deviceClass, passed });
    return { ok: true, profile: { ...profile } };
  }

  recordAssetProvenance(input) {
    const assetId = clean(input?.assetId, 120);
    const sourceType = clean(input?.sourceType, 64);
    const rightsEvidenceReference = clean(input?.rightsEvidenceReference, 240);
    const originalOrLicensed = input?.originalOrLicensed === true;
    if (!assetId || !sourceType || !rightsEvidenceReference)
      return { ok: false, error: "invalid_asset_provenance_record" };

    const record = {
      recordId: randomUUID(),
      assetId,
      sourceType,
      rightsEvidenceReference,
      originalOrLicensed,
      approved: originalOrLicensed,
      recordedAt: new Date().toISOString(),
    };
    this.#assets.set(assetId, record);
    this.#record("asset-provenance-recorded", { assetId, approved: record.approved });
    return { ok: true, record: { ...record } };
  }

  evaluateMaturity(requestedStage) {
    const stage = clean(requestedStage, 32);
    if (!this.maturityStages.includes(stage))
      return { ok: false, error: "invalid_maturity_stage" };

    const blockingRequirements = [];
    if (stage === "release-ready") {
      for (const requirement of this.releaseReadyRequirements) {
        const evidence = this.#evidence.get(requirement);
        if (!evidence?.passed) blockingRequirements.push(requirement);
      }

      const physicalProfiles = [...this.#devices.values()].filter(profile => profile.passed);
      for (const platform of ["android", "ios", "windows"]) {
        if (!physicalProfiles.some(profile => profile.platform === platform))
          blockingRequirements.push("physical-device:" + platform);
      }

      if ([...this.#assets.values()].some(record => !record.approved))
        blockingRequirements.push("unapproved-asset-provenance");
    }

    const grantedStage = blockingRequirements.length ? "internal-beta" : stage;
    const report = {
      reportId: randomUUID(),
      requestedStage: stage,
      grantedStage,
      blockingRequirements: [...new Set(blockingRequirements)].sort(),
      evaluatedAt: new Date().toISOString(),
    };
    this.#reports.set(report.reportId, report);
    this.#record("maturity-evaluated", {
      requestedStage: stage,
      grantedStage,
      blockingCount: report.blockingRequirements.length,
    });
    return { ok: true, report: structuredClone(report) };
  }

  snapshot() {
    return {
      risks: [...this.#risks.values()].map(value => ({ ...value })),
      evidence: [...this.#evidence.values()].map(value => ({ ...value })),
      deviceProfiles: [...this.#devices.values()].map(value => ({ ...value })),
      assetProvenance: [...this.#assets.values()].map(value => ({ ...value })),
    };
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
