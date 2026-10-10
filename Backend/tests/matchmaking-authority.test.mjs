import test from "node:test";
import assert from "node:assert/strict";
import { FairMatchmakingPolicyService } from "../src/services/fair-matchmaking-policy.mjs";
import { MatchmakingAuthorityService } from "../src/services/matchmaking-authority.mjs";
import { matchmakingAuthorityRuntime } from "../src/matchmaking-authority-contracts.mjs";

function makeService() {
  const policy = new FairMatchmakingPolicyService(matchmakingAuthorityRuntime);
  return {
    policy,
    service: new MatchmakingAuthorityService({
      policy,
      contract: matchmakingAuthorityRuntime,
    }),
  };
}

function ticket(service, overrides = {}, now = 1000000) {
  return service.enqueue({
    partyId: overrides.partyId || "party-" + Math.random(),
    playerIds: overrides.playerIds || ["p-" + Math.random()],
    sectionId: overrides.sectionId || "multiplayer",
    modeId: overrides.modeId || "team-score",
    platform: overrides.platform || "android",
    preferredRegions: overrides.preferredRegions || ["west-africa"],
    skillRating: overrides.skillRating ?? 1000,
    allowCrossPlatform: overrides.allowCrossPlatform ?? true,
  }, now);
}

test("search is time bounded and expires", () => {
  const { service } = makeService();
  const created = ticket(service, {}, 1000000);
  assert.equal(created.ok, true);
  service.run(1000000 + matchmakingAuthorityRuntime.defaults.maximumSearchSeconds * 1000);
  assert.equal(service.getTicket(created.ticket.ticketId).state, "expired");
});

test("skill tolerance widens gradually with wait time", () => {
  const { policy } = makeService();
  assert.equal(policy.allowedSkillDelta(0), 100);
  assert.equal(policy.allowedSkillDelta(60), 400);
  assert.equal(policy.allowedSkillDelta(999), 600);
});

test("matching requires shared region and respects cross-platform opt-out", () => {
  const { service } = makeService();
  ticket(service, {
    partyId: "a",
    playerIds: ["p1"],
    platform: "android",
    preferredRegions: ["west-africa"],
  }, 1000000);
  ticket(service, {
    partyId: "b",
    playerIds: ["p2"],
    platform: "windows",
    preferredRegions: ["west-africa"],
    allowCrossPlatform: false,
  }, 1000000);

  assert.equal(service.run(1000100).assignments.length, 0);
});

test("oldest compatible parties match without splitting party membership", () => {
  const { service } = makeService();
  const a = ticket(service, {
    partyId: "a",
    playerIds: ["p1", "p2"],
    skillRating: 1000,
  }, 1000000);
  const b = ticket(service, {
    partyId: "b",
    playerIds: ["p3", "p4"],
    skillRating: 1080,
  }, 1001000);
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);

  const run = service.run(1002000);
  assert.equal(run.assignments.length, 1);
  assert.deepEqual(run.assignments[0].playerIds.sort(), ["p1", "p2", "p3", "p4"]);
});

test("runtime contract explicitly describes fair region-aware placement", () => {
  assert.match(matchmakingAuthorityRuntime.rule, /shared accepted region/i);
  assert.match(matchmakingAuthorityRuntime.rule, /widen skill tolerance gradually/i);
});
