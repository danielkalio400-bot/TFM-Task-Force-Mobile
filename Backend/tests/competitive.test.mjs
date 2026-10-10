import test from "node:test";
import assert from "node:assert/strict";
import { PrivateMatchService } from "../src/services/private-matches.mjs";
import { RankedService } from "../src/services/ranked.mjs";

test("private match creation supports code privacy and bounded size", () => {
  const service = new PrivateMatchService();
  const result = service.create({
    ownerPlayerId: "p1",
    modeId: "mp-team-score",
    privacy: "private-code",
    maxPlayers: 500,
    teamSize: 5,
  });

  assert.equal(result.ok, true);
  assert.equal(result.match.maxPlayers, 100);
  assert.ok(result.match.joinCode.length >= 6);
});

test("ranked state changes through validated result application", () => {
  const service = new RankedService();
  const first = service.get("p1");
  assert.equal(first.tier, "recruit");

  const result = service.applyResult("p1", true, 1000);
  assert.ok(result.rating > 0);
  assert.equal(result.matchesPlayed, 1);
  assert.equal(result.wins, 1);
});
