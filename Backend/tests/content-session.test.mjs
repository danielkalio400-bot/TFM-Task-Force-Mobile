import test from "node:test";
import assert from "node:assert/strict";
import { originalMapCatalog, contentPackCatalog } from "../src/content-contracts.mjs";
import { MapCatalogService } from "../src/services/map-catalog.mjs";
import { ContentInstallationService } from "../src/services/content-installation.mjs";
import { SectionRecoveryService } from "../src/services/section-recovery.mjs";
import { SectionSessionCoordinator } from "../src/services/section-session-coordinator.mjs";
import { ModeRuntimeService } from "../src/services/mode-runtime.mjs";
import { BattleRoyaleRuntimeService } from "../src/services/br-runtime.mjs";
import { CoopRuntimeService } from "../src/services/coop-runtime.mjs";
import { ExtractionRuntimeService } from "../src/services/extraction-runtime.mjs";

test("original map catalog contains 32 concept maps across four sections", () => {
  assert.equal(originalMapCatalog.maps.length, 32);
  const sections = new Set(originalMapCatalog.maps.map(map => map.section));
  assert.deepEqual([...sections].sort(), ["battle-royale", "dmz-recon", "multiplayer", "zombies"]);
});

test("content pack sizes remain unclaimed until measured assets exist", () => {
  assert.ok(contentPackCatalog.packs.every(pack => pack.estimatedDownloadBytes === 0));
  const service = new ContentInstallationService(contentPackCatalog);
  const updated = service.update("multiplayer", {
    state: "installed",
    installedVersion: "dev-1",
  });
  assert.equal(updated.ok, true);
  assert.equal(service.get("multiplayer").state, "installed");
});

test("section coordinator rejects cross-section maps and creates valid runtime", () => {
  const maps = new MapCatalogService(originalMapCatalog);
  const coordinator = new SectionSessionCoordinator({
    maps,
    multiplayer: new ModeRuntimeService(),
    battleRoyale: new BattleRoyaleRuntimeService(),
    coop: new CoopRuntimeService(),
    extraction: new ExtractionRuntimeService(),
  });

  assert.equal(coordinator.create({
    section: "battle-royale",
    mapId: "harborline",
  }).error, "map_not_valid_for_section");

  const valid = coordinator.create({
    section: "zombies",
    mapId: "silent-research",
    participants: 4,
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.session.runtimeType, "cooperative");
});

test("section recovery is player-bound and single-use", () => {
  const service = new SectionRecoveryService();
  const created = service.create({
    matchId: "m1",
    playerId: "p1",
    sectionId: "multiplayer",
    serverId: "s1",
    mapId: "harborline",
  });
  assert.equal(created.ok, true);
  assert.equal(service.consume(created.recovery.recoveryId, "p2").error, "section_recovery_player_mismatch");
  assert.equal(service.consume(created.recovery.recoveryId, "p1").ok, true);
  assert.equal(service.consume(created.recovery.recoveryId, "p1").error, "section_recovery_consumed");
});
