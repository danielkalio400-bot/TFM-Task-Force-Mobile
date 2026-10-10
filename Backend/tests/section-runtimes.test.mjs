import test from "node:test";
import assert from "node:assert/strict";
import { BattleRoyaleRuntimeService } from "../src/services/br-runtime.mjs";
import { CoopRuntimeService } from "../src/services/coop-runtime.mjs";
import { ExtractionRuntimeService } from "../src/services/extraction-runtime.mjs";
import { homeSections } from "../src/section-contracts.mjs";

test("home screen preserves four primary TFM sections", () => {
  assert.deepEqual(
    homeSections.sections.map(section => section.id),
    ["multiplayer", "battle-royale", "zombies", "dmz-recon"]
  );
});

test("battle royale runtime advances zone state without exceeding player cap", () => {
  const service = new BattleRoyaleRuntimeService();
  const created = service.create({ connectedPlayers: 150 });
  assert.equal(created.runtime.connectedPlayers, 100);

  const advanced = service.advance(created.runtime.matchId, 120);
  assert.equal(advanced.ok, true);
  assert.equal(advanced.runtime.zoneStage, 1);
});

test("cooperative runtime requires objectives before advancing wave", () => {
  const service = new CoopRuntimeService();
  const created = service.create({ participants: 4, remainingObjectives: 1 });
  assert.equal(service.advanceWave(created.runtime.sessionId).error, "objectives_remaining");
  service.completeObjective(created.runtime.sessionId, 1);
  assert.equal(service.advanceWave(created.runtime.sessionId, 2).ok, true);
});

test("extraction runtime requires contract progress before extraction", () => {
  const service = new ExtractionRuntimeService();
  const created = service.create({ squadSize: 4 });
  assert.equal(service.extract(created.runtime.matchId).error, "extraction_not_available");
  service.completeContract(created.runtime.matchId);
  assert.equal(service.extract(created.runtime.matchId).ok, true);
});
