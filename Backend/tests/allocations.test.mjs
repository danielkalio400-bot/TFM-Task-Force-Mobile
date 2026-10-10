import test from "node:test";
import assert from "node:assert/strict";
import { AllocationService } from "../src/services/allocations.mjs";

test("allocation request creates a pending placeholder", () => {
  const service = new AllocationService();
  const result = service.create({ matchId: "match-1", region: "west-africa" });
  assert.equal(result.ok, true);
  assert.equal(result.allocation.state, "pending");

  const loaded = service.get(result.allocation.allocationId);
  assert.equal(loaded.matchId, "match-1");
});
