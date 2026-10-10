import { randomUUID } from "node:crypto";

function clean(value, max = 160) {
  const result = String(value || "").trim();
  return result && result.length <= max ? result : "";
}

export class OperationsReliabilityService {
  #availability = new Map();
  #deployments = new Map();
  #rollbacks = new Map();
  #crashes = new Map();
  #loadTests = new Map();
  #audit = [];

  constructor({ health, incidents, liveOperations, contract }) {
    this.health = health;
    this.incidents = incidents;
    this.liveOperations = liveOperations;
    this.contract = contract;
  }

  serviceHealth(region = "west-africa") {
    const snapshot = this.health.snapshot(region);
    return {
      ...snapshot,
      availability: [...this.#availability.values()]
        .filter(entry => entry.region === region)
        .map(entry => ({ ...entry })),
    };
  }

  recordAvailability(input) {
    const service = clean(input?.service, 64);
    const region = clean(input?.region || "west-africa", 64);
    const observed = Math.max(0, Math.min(1, Number(input?.observedAvailability01)));
    if (!service || !region || !Number.isFinite(observed))
      return { ok: false, error: "invalid_availability_sample" };

    const targetFromContract = this.contract.defaultAvailabilityTargets?.[service];
    const target = Math.max(
      0,
      Math.min(1, Number(input?.targetAvailability01 ?? targetFromContract ?? 0.99))
    );

    const state = {
      service,
      region,
      targetAvailability01: target,
      observedAvailability01: observed,
      status: observed >= target ? "healthy" : "below-target",
      windowStart: clean(input?.windowStart, 64) || new Date(Date.now() - 3600000).toISOString(),
      windowEnd: clean(input?.windowEnd, 64) || new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    };

    this.#availability.set(region + ":" + service, state);
    this.#record("availability-recorded", { service, region, status: state.status });
    return { ok: true, availability: { ...state } };
  }

  createDeployment(input) {
    const service = clean(input?.service, 64);
    const region = clean(input?.region || "west-africa", 64);
    const version = clean(input?.version, 80);
    if (!service || !region || !version)
      return { ok: false, error: "invalid_deployment_revision" };

    const deployment = {
      deploymentId: randomUUID(),
      service,
      region,
      version,
      previousVersion: clean(input?.previousVersion, 80),
      state: "candidate",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.#deployments.set(deployment.deploymentId, deployment);
    this.#record("deployment-created", {
      deploymentId: deployment.deploymentId,
      service,
      region,
      version,
    });
    return { ok: true, deployment: { ...deployment } };
  }

  updateDeployment(deploymentId, state) {
    const deployment = this.#deployments.get(String(deploymentId || ""));
    if (!deployment) return { ok: false, error: "deployment_not_found" };
    if (!["candidate", "deploying", "active", "degraded", "rolled-back"].includes(state))
      return { ok: false, error: "invalid_deployment_state" };

    deployment.state = state;
    deployment.updatedAt = new Date().toISOString();
    this.#record("deployment-state", { deploymentId, state });
    return { ok: true, deployment: { ...deployment } };
  }

  rollback(deploymentId, input) {
    const deployment = this.#deployments.get(String(deploymentId || ""));
    if (!deployment) return { ok: false, error: "deployment_not_found" };
    if (!deployment.previousVersion)
      return { ok: false, error: "no_previous_deployment_version" };

    deployment.state = "rolled-back";
    deployment.updatedAt = new Date().toISOString();

    const rollback = {
      rollbackId: randomUUID(),
      deploymentId: deployment.deploymentId,
      reasonCode: clean(input?.reasonCode || "health-gate", 80),
      restoredVersion: deployment.previousVersion,
      recordedAt: new Date().toISOString(),
    };
    this.#rollbacks.set(rollback.rollbackId, rollback);
    this.#record("deployment-rollback", {
      deploymentId: deployment.deploymentId,
      rollbackId: rollback.rollbackId,
      restoredVersion: rollback.restoredVersion,
    });
    return { ok: true, rollback: { ...rollback }, deployment: { ...deployment } };
  }

  recordCrash(input) {
    const service = clean(input?.service, 64);
    const region = clean(input?.region || "west-africa", 64);
    const buildId = clean(input?.buildId, 80);
    const signature = clean(input?.signature, 128);
    if (!service || !region || !buildId || !signature)
      return { ok: false, error: "invalid_crash_diagnostic" };

    const key = [service, region, buildId, signature].join(":");
    const existing = this.#crashes.get(key);
    const now = new Date().toISOString();
    const diagnostic = existing || {
      diagnosticId: randomUUID(),
      service,
      region,
      buildId,
      signature,
      occurrenceCount: 0,
      firstSeenAt: now,
      lastSeenAt: now,
    };
    diagnostic.occurrenceCount += Math.max(1, Math.trunc(Number(input?.occurrenceCount) || 1));
    diagnostic.lastSeenAt = now;
    this.#crashes.set(key, diagnostic);

    this.#record("crash-diagnostic", {
      diagnosticId: diagnostic.diagnosticId,
      service,
      region,
      buildId,
      occurrenceCount: diagnostic.occurrenceCount,
    });
    return { ok: true, diagnostic: { ...diagnostic } };
  }

  recordLoadTest(input) {
    const region = clean(input?.region || "west-africa", 64);
    const targetConcurrentPlayers = Math.max(1, Math.trunc(Number(input?.targetConcurrentPlayers) || 0));
    const successfulSessions = Math.max(0, Math.trunc(Number(input?.successfulSessions) || 0));
    const failedSessions = Math.max(0, Math.trunc(Number(input?.failedSessions) || 0));
    const p95LatencyMs = Math.max(0, Number(input?.p95LatencyMs) || 0);
    const total = successfulSessions + failedSessions;
    if (!region || targetConcurrentPlayers < 1 || total < 1)
      return { ok: false, error: "invalid_load_test" };

    const errorRate01 = failedSessions / total;
    const passed =
      errorRate01 <= this.contract.loadGate.maximumErrorRate01 &&
      p95LatencyMs <= this.contract.loadGate.maximumP95LatencyMs;

    const summary = {
      testId: randomUUID(),
      region,
      targetConcurrentPlayers,
      successfulSessions,
      failedSessions,
      p95LatencyMs,
      errorRate01,
      passed,
      recordedAt: new Date().toISOString(),
    };
    this.#loadTests.set(summary.testId, summary);
    this.#record("load-test-recorded", {
      testId: summary.testId,
      region,
      passed,
    });
    return { ok: true, summary: { ...summary } };
  }

  setRegionalRouting(region, input) {
    const state = this.liveOperations.update(region, {
      matchmakingEnabled: input?.matchmakingEnabled,
      rankedEnabled: input?.rankedEnabled,
      privateMatchesEnabled: input?.privateMatchesEnabled,
      newServerAssignmentsEnabled: input?.newServerAssignmentsEnabled,
      maintenanceMessage: input?.maintenanceMessage,
    });
    this.#record("regional-routing-updated", {
      region: state.region,
      newServerAssignmentsEnabled: state.newServerAssignmentsEnabled,
    });
    return { ok: true, state };
  }

  incidentAudit(limit = 100) {
    const count = Math.min(500, Math.max(1, Math.trunc(Number(limit) || 100)));
    return this.#audit.slice(-count).map(event => ({ ...event, details: { ...event.details } }));
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
