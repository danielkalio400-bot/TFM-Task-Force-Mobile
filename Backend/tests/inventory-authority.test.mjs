import test from "node:test";
import assert from "node:assert/strict";
import { InventoryLedger } from "../src/services/inventory-ledger.mjs";
import { InventoryAuthorityService } from "../src/services/inventory-authority.mjs";
import { inventoryAuthorityRuntime } from "../src/inventory-authority-contracts.mjs";

function makeService() {
  return new InventoryAuthorityService({
    ledger: new InventoryLedger(),
    contract: inventoryAuthorityRuntime,
  });
}

test("inventory authority rejects untrusted client-authored source", () => {
  const service = makeService();
  const result = service.mutate({
    playerId: "p1",
    itemId: "skin-1",
    quantity: 1,
    kind: "grant",
    authoritySource: "client-request",
    sourceId: "request-1",
  });
  assert.equal(result.error, "untrusted_inventory_authority_source");
});

test("trusted mutation is idempotent", () => {
  const service = makeService();
  const input = {
    playerId: "p1",
    itemId: "skin-1",
    quantity: 1,
    kind: "grant",
    authoritySource: "entitlement-grant",
    sourceId: "entitlement-1",
  };

  const first = service.mutate(input);
  const second = service.mutate(input);
  assert.equal(first.ok, true);
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(service.balance("p1", "skin-1").balance.quantity, 1);
});

test("consume cannot produce negative inventory", () => {
  const service = makeService();
  const result = service.mutate({
    playerId: "p1",
    itemId: "token-1",
    quantity: 1,
    kind: "consume",
    authoritySource: "server-consumption",
    sourceId: "consume-1",
  });
  assert.equal(result.error, "insufficient_inventory");
});

test("runtime contract explicitly denies direct client mutation", () => {
  assert.match(inventoryAuthorityRuntime.rule, /Clients may read/i);
  assert.match(inventoryAuthorityRuntime.rule, /may not directly author inventory mutations/i);
});
