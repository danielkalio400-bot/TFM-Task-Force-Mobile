import test from "node:test";
import assert from "node:assert/strict";
import { ProductGovernanceService } from "../src/services/product-governance.mjs";
import { productGovernanceRuntime } from "../src/product-governance-contracts.mjs";

test("risk register contains every blueprint governance risk", () => {
  const service = new ProductGovernanceService(productGovernanceRuntime);
  const snapshot = service.snapshot();
  assert.equal(snapshot.risks.length, productGovernanceRuntime.riskCategories.length);
});

test("release-ready status is blocked without required evidence and physical device profiles", () => {
  const service = new ProductGovernanceService(productGovernanceRuntime);
  const report = service.evaluateMaturity("release-ready");
  assert.equal(report.ok, true);
  assert.equal(report.report.grantedStage, "internal-beta");
  assert.ok(report.report.blockingRequirements.length > 0);
});

test("closed risk requires mitigation evidence", () => {
  const service = new ProductGovernanceService(productGovernanceRuntime);
  const result = service.updateRisk({
    category: "credential-leakage",
    status: "closed",
  });
  assert.equal(result.error, "closed_risk_requires_evidence");
});

test("asset provenance requires original or licensed content for approval", () => {
  const service = new ProductGovernanceService(productGovernanceRuntime);
  const record = service.recordAssetProvenance({
    assetId: "environment-001",
    sourceType: "original",
    rightsEvidenceReference: "internal:asset-rights-001",
    originalOrLicensed: true,
  });
  assert.equal(record.ok, true);
  assert.equal(record.record.approved, true);
  assert.match(productGovernanceRuntime.rule, /protected CODM content must not be copied/i);
});

test("physical device profile only passes when actually tested", () => {
  const service = new ProductGovernanceService(productGovernanceRuntime);
  const result = service.recordDeviceProfile({
    platform: "android",
    deviceClass: "mid-range",
    buildId: "build-100",
    averageFps: 60,
    peakMemoryBytes: 1500000000,
    physicalDeviceTested: false,
  });
  assert.equal(result.profile.passed, false);
});
