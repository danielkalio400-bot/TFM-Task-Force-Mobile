import test from "node:test";
import assert from "node:assert/strict";
import { ReleaseObservabilityService } from "../src/services/release-observability.mjs";
import { releaseObservabilityRuntime } from "../src/release-observability-contracts.mjs";

function healthySample(overrides = {}) {
  return { artifactId:"artifact-29", platform:"android", cohort:"mid-tier", sessions:300, crashes:2, anrs:0,
    p50FrameMs:17, p95FrameMs:28, memoryMbP95:1200, thermalSevereRate:0.03,
    networkDisconnectRate:0.01, batteryDrainPctPerHour:15, sourceReference:"internal-perf-lab", ...overrides };
}

test("healthy release cohort can continue rollout", () => {
  const service = new ReleaseObservabilityService(releaseObservabilityRuntime);
  assert.equal(service.ingest(healthySample()).ok, true);
  const result = service.evaluate({ artifactId:"artifact-29", platform:"android", cohort:"mid-tier" });
  assert.equal(result.report.decision, "continue");
});
test("insufficient sample size holds rollout", () => {
  const service = new ReleaseObservabilityService(releaseObservabilityRuntime);
  service.ingest(healthySample({ sessions:20, crashes:0 }));
  const result = service.evaluate({ artifactId:"artifact-29", platform:"android", cohort:"mid-tier" });
  assert.equal(result.report.decision, "hold");
  assert.match(result.report.blockingReasons[0], /^insufficient-sessions:/);
});
test("poor crash health escalates to rollback review", () => {
  const service = new ReleaseObservabilityService(releaseObservabilityRuntime);
  service.ingest(healthySample({ crashes:15 }));
  const result = service.evaluate({ artifactId:"artifact-29", platform:"android", cohort:"mid-tier" });
  assert.equal(result.report.decision, "rollback-review");
  assert.ok(result.report.reviewReasons.includes("crash-free-session-rate"));
});
test("hard performance budget breach holds rollout", () => {
  const service = new ReleaseObservabilityService(releaseObservabilityRuntime);
  service.ingest(healthySample({ p95FrameMs:49 }));
  const result = service.evaluate({ artifactId:"artifact-29", platform:"android", cohort:"mid-tier" });
  assert.equal(result.report.decision, "hold");
  assert.ok(result.report.blockingReasons.includes("p95-frame-time"));
});
test("baseline regression is detected", () => {
  const service = new ReleaseObservabilityService(releaseObservabilityRuntime);
  service.setBaseline({ platform:"android", cohort:"mid-tier", crashRate:0.003, p95FrameMs:22, memoryMbP95:1000, networkDisconnectRate:0.008, sourceArtifactId:"previous-stable" });
  service.ingest(healthySample({ p95FrameMs:28, memoryMbP95:1200 }));
  const result = service.evaluate({ artifactId:"artifact-29", platform:"android", cohort:"mid-tier" });
  assert.equal(result.report.decision, "rollback-review");
  assert.ok(result.report.reviewReasons.includes("frame-time-regression"));
});
