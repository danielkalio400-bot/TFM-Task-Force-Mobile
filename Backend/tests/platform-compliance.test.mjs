import test from "node:test";
import assert from "node:assert/strict";
import { PlatformComplianceService } from "../src/services/platform-compliance.mjs";
import { platformComplianceRuntime } from "../src/platform-compliance-contracts.mjs";

test("release candidate stays blocked until every required check passes", () => {
  const service = new PlatformComplianceService(platformComplianceRuntime);
  const blocked = service.evaluate({
    platform: "android",
    channel: "stable",
    version: "1.0.0",
    buildNumber: 100,
  });
  assert.equal(blocked.ok, true);
  assert.equal(blocked.report.state, "blocked");
  assert.ok(blocked.report.blockingChecks.length > 0);

  for (const category of platformComplianceRuntime.requiredCategories) {
    const result = service.upsertCheck({
      platform: "android",
      category,
      status: "passed",
      evidenceReference: "internal-evidence:" + category,
    });
    assert.equal(result.ok, true);
  }

  const candidate = service.evaluate({
    platform: "android",
    channel: "stable",
    version: "1.0.0",
    buildNumber: 100,
  });
  assert.equal(candidate.report.state, "candidate");
  assert.deepEqual(candidate.report.blockingChecks, []);
});

test("passed compliance checks require evidence", () => {
  const service = new PlatformComplianceService(platformComplianceRuntime);
  const result = service.upsertCheck({
    platform: "ios",
    category: "privacy-disclosure",
    status: "passed",
  });
  assert.equal(result.error, "passed_check_requires_evidence");
});

test("required check cannot be marked not applicable", () => {
  const service = new PlatformComplianceService(platformComplianceRuntime);
  const result = service.upsertCheck({
    platform: "windows",
    category: "account-deletion",
    status: "not-applicable",
  });
  assert.equal(result.error, "required_check_cannot_be_not_applicable");
});

test("contract does not claim external certification", () => {
  assert.match(platformComplianceRuntime.productionBoundary, /does not constitute/i);
  assert.match(platformComplianceRuntime.productionBoundary, /certification/i);
});
