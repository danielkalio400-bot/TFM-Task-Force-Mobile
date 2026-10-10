import test from "node:test";
import assert from "node:assert/strict";
import { OperationsReliabilityService } from "../src/services/operations-reliability.mjs";
import { operationsReliabilityRuntime } from "../src/operations-reliability-contracts.mjs";

class HealthStub {
  snapshot(region) {
    return {
      region,
      matchmaking: "healthy",
      gameServers: "healthy",
      progression: "healthy",
      readyServers: 2,
      degradedServers: 0,
      openIncidents: 0,
      capturedAt: new Date().toISOString(),
    };
  }
}

class LiveOpsStub {
  update(region, patch) {
    return {
      region,
      matchmakingEnabled: patch.matchmakingEnabled ?? true,
      rankedEnabled: patch.rankedEnabled ?? true,
      privateMatchesEnabled: patch.privateMatchesEnabled ?? true,
      newServerAssignmentsEnabled: patch.newServerAssignmentsEnabled ?? true,
      maintenanceMessage: patch.maintenanceMessage || "",
    };
  }
}

function service() {
  return new OperationsReliabilityService({
    health: new HealthStub(),
    incidents: { open: () => [] },
    liveOperations: new LiveOpsStub(),
    contract: operationsReliabilityRuntime,
  });
}

test("availability target reports below-target state", () => {
  const result = service().recordAvailability({
    service: "matchmaking",
    region: "west-africa",
    observedAvailability01: 0.98,
  });
  assert.equal(result.ok, true);
  assert.equal(result.availability.status, "below-target");
});

test("deployment can be rolled back to known previous version", () => {
  const reliability = service();
  const created = reliability.createDeployment({
    service: "matchmaking",
    region: "west-africa",
    version: "2",
    previousVersion: "1",
  });
  assert.equal(created.ok, true);
  const rolled = reliability.rollback(created.deployment.deploymentId, {
    reasonCode: "health-gate",
  });
  assert.equal(rolled.ok, true);
  assert.equal(rolled.rollback.restoredVersion, "1");
});

test("load test uses latency and error-rate gates", () => {
  const reliability = service();
  const passed = reliability.recordLoadTest({
    region: "west-africa",
    targetConcurrentPlayers: 1000,
    successfulSessions: 990,
    failedSessions: 10,
    p95LatencyMs: 180,
  });
  assert.equal(passed.ok, true);
  assert.equal(passed.summary.passed, true);

  const failed = reliability.recordLoadTest({
    region: "west-africa",
    targetConcurrentPlayers: 1000,
    successfulSessions: 900,
    failedSessions: 100,
    p95LatencyMs: 400,
  });
  assert.equal(failed.summary.passed, false);
});

test("operations contract minimizes private player data", () => {
  assert.match(operationsReliabilityRuntime.rule, /without placing private player data/i);
});
