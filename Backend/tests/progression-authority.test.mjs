import test from "node:test";
import assert from "node:assert/strict";
import { ProfileService } from "../src/services/profiles.mjs";
import { ProgressionAuditService } from "../src/services/progression-audit.mjs";
import { ProgressionUnlockService } from "../src/services/progression-unlocks.mjs";
import { ProgressionLeaderboardService } from "../src/services/progression-leaderboard.mjs";
import { ProgressionAuthorityService } from "../src/services/progression-authority.mjs";
import { progressionAuthorityRuntime } from "../src/progression-authority-contracts.mjs";

function makeService() {
  const profiles = new ProfileService();
  const audit = new ProgressionAuditService();
  const unlocks = new ProgressionUnlockService(progressionAuthorityRuntime.unlockRules);
  const leaderboard = new ProgressionLeaderboardService();
  const authority = new ProgressionAuthorityService({
    profiles,
    audit,
    unlocks,
    leaderboard,
    contract: progressionAuthorityRuntime,
  });
  return { profiles, audit, unlocks, leaderboard, authority };
}

test("trusted server progression grant is idempotent and audited", () => {
  const { authority, audit } = makeService();

  const first = authority.grant({
    playerId: "p1",
    sourceType: "validated-match-result",
    sourceId: "match-1",
    experience: 900,
    softCredits: 50,
  });
  assert.equal(first.ok, true);
  assert.equal(first.duplicate, false);

  const second = authority.grant({
    playerId: "p1",
    sourceType: "validated-match-result",
    sourceId: "match-1",
    experience: 900,
    softCredits: 50,
  });
  assert.equal(second.ok, true);
  assert.equal(second.duplicate, true);
  assert.equal(second.progression.totalExperience, 900);
  assert.equal(audit.list("p1").length, 1);
});

test("untrusted source cannot mutate progression", () => {
  const { authority } = makeService();
  const result = authority.grant({
    playerId: "p1",
    sourceType: "client-request",
    sourceId: "x",
    experience: 999999,
  });
  assert.equal(result.error, "untrusted_or_invalid_progression_source");
});

test("level based unlocks and leaderboard update from authoritative grants", () => {
  const { authority, leaderboard } = makeService();
  const result = authority.grant({
    playerId: "p1",
    sourceType: "migration",
    sourceId: "seed-1",
    experience: 12000,
    softCredits: 0,
  });
  assert.equal(result.ok, true);
  assert.ok(result.unlocks.length >= 1);
  assert.equal(leaderboard.top(1)[0].playerId, "p1");
});

test("runtime contract forbids client-authored progression authority", () => {
  assert.ok(progressionAuthorityRuntime.systems.includes("progression-audit-history"));
  assert.match(progressionAuthorityRuntime.rule, /trusted server-side sources/i);
});
