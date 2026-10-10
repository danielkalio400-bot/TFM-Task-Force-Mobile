import test from "node:test";
import assert from "node:assert/strict";
import { ProfileService } from "../src/services/profiles.mjs";

test("progression grants experience and soft credits", () => {
  const service = new ProfileService();
  const first = service.getOrCreate("player-1");
  assert.equal(first.level, 1);

  const granted = service.grant("player-1", { experience: 900, credits: 250 });
  assert.equal(granted.ok, true);
  assert.equal(granted.progression.level, 2);
  assert.equal(granted.progression.softCredits, 250);
});
