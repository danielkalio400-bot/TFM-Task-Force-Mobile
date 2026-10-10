import test from "node:test";
import assert from "node:assert/strict";
import { ContentEntitlementService } from "../src/services/content-entitlements.mjs";
import { DedicatedSessionCoordinator } from "../src/services/dedicated-session-coordinator.mjs";
import { AuthoritativeRecoveryService } from "../src/services/authoritative-recovery.mjs";
import { TelemetryGateService } from "../src/services/telemetry-gates.mjs";
import { ContentInstallationService } from "../src/services/content-installation.mjs";
import { ContentCompatibilityService } from "../src/services/content-compatibility.mjs";
import { SectionLifecycleService } from "../src/services/section-lifecycle.mjs";
import { SessionPersistenceService } from "../src/services/session-persistence.mjs";
import { ServerRegistry } from "../src/services/server-registry.mjs";
import { ServerAssignmentService } from "../src/services/server-assignments.mjs";
import { LiveOperationsService } from "../src/services/live-operations.mjs";
import { contentPackCatalog } from "../src/content-contracts.mjs";
import { contentCompatibility } from "../src/readiness-contracts.mjs";
import { productionTelemetryGates } from "../src/production-contracts.mjs";

test("entitlements are checked independently from installed content", () => {
  const entitlements = new ContentEntitlementService(contentPackCatalog);
  entitlements.grant({ playerId: "p1", packId: "core" });
  const result = entitlements.checkSection("p1", ["core", "multiplayer"]);
  assert.equal(result.granted, false);
  assert.deepEqual(result.missing.map(item => item.packId), ["multiplayer"]);
});

test("dedicated allocation requires lifecycle and regional operations readiness", () => {
  const lifecycles = new SectionLifecycleService();
  const lifecycle = lifecycles.create({
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
    matchId: "m1",
  });
  lifecycles.move(lifecycle.lifecycle.lifecycleId, "checking-content");
  lifecycles.move(lifecycle.lifecycle.lifecycleId, "checking-map");
  lifecycles.move(lifecycle.lifecycle.lifecycleId, "creating-session");
  lifecycles.move(lifecycle.lifecycle.lifecycleId, "allocating-server");

  const servers = new ServerRegistry();
  servers.heartbeat({
    serverId: "s1",
    region: "west-africa",
    endpoint: "127.0.0.1:7777",
    capacity: 20,
    playerCount: 0,
    health: "ready",
  });

  const service = new DedicatedSessionCoordinator({
    liveOperations: new LiveOperationsService(),
    assignments: new ServerAssignmentService(servers),
    lifecycles,
    persistence: new SessionPersistenceService(),
  });

  const result = service.allocate({
    lifecycleId: lifecycle.lifecycle.lifecycleId,
    matchId: "m1",
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
    region: "west-africa",
  });
  assert.equal(result.ok, true);
  assert.equal(result.lifecycle.phase, "connecting");
});

test("authoritative recovery binds to latest non-terminal snapshot and is single-use", () => {
  const persistence = new SessionPersistenceService();
  persistence.save({
    matchId: "m1",
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
    serverId: "s1",
    runtimePhase: "active",
  });

  const recovery = new AuthoritativeRecoveryService(persistence);
  const created = recovery.create({ matchId: "m1", playerId: "p1" });
  assert.equal(created.ok, true);
  assert.equal(recovery.consume(created.recovery.recoveryId, "p1").ok, true);
  assert.equal(recovery.consume(created.recovery.recoveryId, "p1").error, "authoritative_recovery_consumed");
});

test("telemetry gate evaluates mobile and PC metrics against explicit defaults", () => {
  const service = new TelemetryGateService(productionTelemetryGates);
  assert.equal(service.evaluate({
    platform: "android",
    averageFrameTimeMs: 20,
    averageRoundTripMs: 70,
    averagePacketLoss01: 0.01,
    averageThermalLevel01: 0.5,
  }).report.state, "passed");

  assert.equal(service.evaluate({
    platform: "windows",
    averageFrameTimeMs: 50,
    averageRoundTripMs: 70,
    averagePacketLoss01: 0.01,
    averageThermalLevel01: 0.2,
  }).report.state, "blocked");
});
