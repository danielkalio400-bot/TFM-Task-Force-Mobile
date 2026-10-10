import test from "node:test";
import assert from "node:assert/strict";
import { RecoveryService } from "../src/services/recovery.mjs";

test("recovery record is single use for the same player", () => {
  const service = new RecoveryService();
  const issued = service.issue("player-a", "match-a");
  assert.equal(issued.ok, true);

  const consumed = service.consume(issued.recovery.recoveryId, "player-a");
  assert.equal(consumed.ok, true);
  assert.equal(consumed.recovery.state, "consumed");

  const second = service.consume(issued.recovery.recoveryId, "player-a");
  assert.deepEqual(second, { ok: false, error: "recovery_not_available" });
});

test("recovery rejects a different player", () => {
  const service = new RecoveryService();
  const issued = service.issue("player-a", "match-a");
  assert.equal(service.consume(issued.recovery.recoveryId, "player-b").ok, false);
});
