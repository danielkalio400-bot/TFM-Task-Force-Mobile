import test from "node:test";
import assert from "node:assert/strict";
import { ContentDeliveryService } from "../src/services/content-delivery.mjs";
import { ReleaseReadinessService } from "../src/services/release-readiness.mjs";
import { SectionLaunchService } from "../src/services/section-launch.mjs";
import { ContentInstallationService } from "../src/services/content-installation.mjs";
import { ContentCompatibilityService } from "../src/services/content-compatibility.mjs";
import { MapCatalogService } from "../src/services/map-catalog.mjs";
import { MapReadinessService } from "../src/services/map-readiness.mjs";
import { SectionLifecycleService } from "../src/services/section-lifecycle.mjs";
import { SectionSessionCoordinator } from "../src/services/section-session-coordinator.mjs";
import { ModeRuntimeService } from "../src/services/mode-runtime.mjs";
import { BattleRoyaleRuntimeService } from "../src/services/br-runtime.mjs";
import { CoopRuntimeService } from "../src/services/coop-runtime.mjs";
import { ExtractionRuntimeService } from "../src/services/extraction-runtime.mjs";
import { contentPackCatalog, originalMapCatalog } from "../src/content-contracts.mjs";
import { contentCompatibility } from "../src/readiness-contracts.mjs";

test("delivery package requires known pack, version and integrity tag", () => {
  const service = new ContentDeliveryService(contentPackCatalog);
  assert.equal(service.publish({ packId: "missing", version: "1", integrityTag: "x" }).error, "content_pack_not_found");
  const created = service.publish({ packId: "core", version: "1", integrityTag: "sha256:example" });
  assert.equal(created.ok, true);
  assert.equal(created.package.state, "available");
});

test("release readiness blocks on every false production gate", () => {
  const service = new ReleaseReadinessService();
  const blocked = service.evaluate({
    platform: "android",
    coreContentReady: true,
    selectedMapsReady: false,
    backendHealthReady: true,
    recoveryReady: true,
    performanceReady: false,
    qaReady: true,
  });
  assert.equal(blocked.report.state, "blocked");
  assert.deepEqual(blocked.report.blockingReasons.sort(), ["performanceReady", "selectedMapsReady"]);

  const candidate = service.evaluate({
    platform: "windows",
    coreContentReady: true,
    selectedMapsReady: true,
    backendHealthReady: true,
    recoveryReady: true,
    performanceReady: true,
    qaReady: true,
  });
  assert.equal(candidate.report.state, "candidate");
});

test("section launch is blocked until content and map prototype readiness exist", () => {
  const installation = new ContentInstallationService(contentPackCatalog);
  const compatibility = new ContentCompatibilityService({
    installation,
    contract: contentCompatibility,
  });
  const maps = new MapCatalogService(originalMapCatalog);
  const mapReadiness = new MapReadinessService(maps);
  const lifecycles = new SectionLifecycleService();
  const sectionSessions = new SectionSessionCoordinator({
    maps,
    multiplayer: new ModeRuntimeService(),
    battleRoyale: new BattleRoyaleRuntimeService(),
    coop: new CoopRuntimeService(),
    extraction: new ExtractionRuntimeService(),
  });
  const launch = new SectionLaunchService({ compatibility, mapReadiness, lifecycles, sectionSessions });

  const blocked = launch.launch({
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
  });
  assert.equal(blocked.error, "content_not_ready");

  installation.update("core", { state: "installed", installedVersion: "dev-1" });
  installation.update("multiplayer", { state: "installed", installedVersion: "dev-1" });
  mapReadiness.update("harborline", {
    state: "gameplay-prototype",
    gameplayValidated: true,
    navigationValidated: true,
  });

  const allowed = launch.launch({
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
  });
  assert.equal(allowed.ok, true);
  assert.equal(allowed.session.runtimeType, "multiplayer");
});
