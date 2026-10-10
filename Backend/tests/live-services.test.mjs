import test from "node:test";
import assert from "node:assert/strict";
import { GameSessionService } from "../src/services/sessions.mjs";
import { InventoryLedger } from "../src/services/inventory-ledger.mjs";
import { MatchResultService } from "../src/services/match-results.mjs";
import { ModerationService } from "../src/services/moderation.mjs";

test("game session is opaque, expiring and revocable", () => {
  const service = new GameSessionService();
  const issued = service.issueForValidatedSubject("bazid-subject-example", 120);
  assert.equal(issued.ok, true);
  assert.ok(issued.session.token.length > 20);
  assert.equal(service.validate(issued.session.token).ok, true);
  assert.equal(service.revoke(issued.session.token), true);
  assert.equal(service.validate(issued.session.token).error, "revoked_session");
});

test("inventory ledger prevents negative balances", () => {
  const ledger = new InventoryLedger();
  const granted = ledger.apply({
    playerId: "p1",
    itemId: "item-1",
    quantity: 2,
    kind: "grant",
    authoritySource: "test",
  });
  assert.equal(granted.ok, true);
  assert.equal(granted.balance, 2);

  const invalid = ledger.apply({
    playerId: "p1",
    itemId: "item-1",
    quantity: 3,
    kind: "consume",
    authoritySource: "test",
  });
  assert.deepEqual(invalid, { ok: false, error: "insufficient_inventory" });
});

test("match results reject unknown servers and duplicates", () => {
  const service = new MatchResultService();
  service.trustLocalServer("server-a");

  const payload = {
    matchId: "match-a",
    serverId: "server-a",
    modeId: "team-score",
    startedAt: "2026-10-10T10:00:00.000Z",
    completedAt: "2026-10-10T10:10:00.000Z",
    players: [{ playerId: "p1", teamId: "a", score: 10, eliminations: 1, assists: 0, experienceGranted: 50 }],
  };

  assert.equal(service.ingest({ ...payload, serverId: "unknown" }).error, "untrusted_server");
  assert.equal(service.ingest(payload).ok, true);
  assert.equal(service.ingest(payload).error, "duplicate_match_result");
});

test("moderation reports reject self-report and accept valid category", () => {
  const service = new ModerationService();
  assert.equal(service.submit({
    reporterPlayerId: "p1",
    reportedPlayerId: "p1",
    category: "other",
  }).ok, false);

  assert.equal(service.submit({
    reporterPlayerId: "p1",
    reportedPlayerId: "p2",
    category: "harassment",
  }).ok, true);
});
