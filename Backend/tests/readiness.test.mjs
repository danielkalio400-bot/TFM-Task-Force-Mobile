import test from "node:test";
import assert from "node:assert/strict";
import { ContentInstallationService } from "../src/services/content-installation.mjs";
import { ContentCompatibilityService } from "../src/services/content-compatibility.mjs";
import { MapCatalogService } from "../src/services/map-catalog.mjs";
import { MapReadinessService } from "../src/services/map-readiness.mjs";
import { SessionPersistenceService } from "../src/services/session-persistence.mjs";
import { SectionLifecycleService } from "../src/services/section-lifecycle.mjs";
import { contentPackCatalog, originalMapCatalog } from "../src/content-contracts.mjs";
import { contentCompatibility } from "../src/readiness-contracts.mjs";

test("section compatibility remains blocked until required packs are installed", () => {
  const installation = new ContentInstallationService(contentPackCatalog);
  const service = new ContentCompatibilityService({
    installation,
    contract: contentCompatibility,
  });

  const first = service.evaluate({ sectionId: "multiplayer" });
  assert.equal(first.report.state, "content-update-required");
  assert.ok(first.report.missingOrOutdatedPackIds.includes("core"));

  installation.update("core", { state: "installed", installedVersion: "dev-1" });
  installation.update("multiplayer", { state: "installed", installedVersion: "dev-1" });
  assert.equal(service.evaluate({ sectionId: "multiplayer" }).report.state, "compatible");
});

test("map readiness defaults to concept-only and requires all release checks", () => {
  const maps = new MapCatalogService(originalMapCatalog);
  const service = new MapReadinessService(maps);

  const initial = service.describe(service.get("harborline"));
  assert.equal(initial.state, "concept-only");
  assert.equal(initial.releaseReady, false);

  const updated = service.update("harborline", {
    state: "release-candidate",
    gameplayValidated: true,
    navigationValidated: true,
    performanceValidatedMobile: true,
    performanceValidatedPc: true,
    lightingValidated: true,
    audioValidated: true,
    qaValidated: true,
  });
  assert.equal(updated.readiness.releaseReady, true);
});

test("session persistence increments snapshot sequence", () => {
  const service = new SessionPersistenceService();
  const first = service.save({
    matchId: "m1",
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
  });
  const second = service.save({
    matchId: "m1",
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
    runtimePhase: "active",
  });

  assert.equal(first.snapshot.sequence, 1);
  assert.equal(second.snapshot.sequence, 2);
  assert.equal(service.latest("m1").runtimePhase, "active");
});

test("section lifecycle enforces ordered transitions and recovery path", () => {
  const service = new SectionLifecycleService();
  const created = service.create({
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
  });
  assert.equal(created.ok, true);
  assert.equal(service.move(created.lifecycle.lifecycleId, "active").error, "invalid_section_lifecycle_transition");
  assert.equal(service.move(created.lifecycle.lifecycleId, "checking-content").ok, true);
  assert.equal(service.move(created.lifecycle.lifecycleId, "checking-map").ok, true);
});
