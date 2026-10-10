import test from "node:test";
import assert from "node:assert/strict";
import { ModeRuntimeService } from "../src/services/mode-runtime.mjs";
import { PartyQueueCoordinator } from "../src/services/party-queue.mjs";
import { PartyService } from "../src/services/parties.mjs";
import { RegionalQueueService } from "../src/services/regional-queues.mjs";
import { ResultPipelineService } from "../src/services/result-pipeline.mjs";
import { MatchResultService } from "../src/services/match-results.mjs";
import { RewardService } from "../src/services/rewards.mjs";
import { ProfileService } from "../src/services/profiles.mjs";
import { LiveOperationsService } from "../src/services/live-operations.mjs";

test("mode runtime creates and updates safe state", () => {
  const service = new ModeRuntimeService();
  const created = service.create({ modeId: "team-score", mapId: "map-a" });
  assert.equal(created.ok, true);
  const updated = service.update(created.runtime.matchId, {
    phase: "active",
    connectedPlayers: 10,
    teamAScore: 12,
  });
  assert.equal(updated.runtime.phase, "active");
  assert.equal(updated.runtime.connectedPlayers, 10);
});

test("ready party can enter a regional queue as one unit", () => {
  const parties = new PartyService();
  const queues = new RegionalQueueService();
  const coordinator = new PartyQueueCoordinator({ parties, queues });

  const created = parties.create({
    playerId: "p1",
    platform: "android",
    skillRating: 1000,
  });
  parties.join(created.party.partyId, {
    playerId: "p2",
    platform: "windows",
    skillRating: 1200,
  });
  parties.setReady(created.party.partyId, "p1", true);
  parties.setReady(created.party.partyId, "p2", true);

  const result = coordinator.enqueue({
    partyId: created.party.partyId,
    modeId: "team-score",
    region: "west-africa",
  });
  assert.equal(result.ok, true);
  assert.equal(result.queue.partySize, 2);
});

test("validated result pipeline applies rewards to progression once", () => {
  const matchResults = new MatchResultService();
  matchResults.trustLocalServer("local-dev-server");
  const rewards = new RewardService();
  const profiles = new ProfileService();
  const pipeline = new ResultPipelineService({ matchResults, rewards, profiles });

  const result = pipeline.process({
    matchId: "m-pipeline-1",
    serverId: "local-dev-server",
    modeId: "team-score",
    winningTeamId: "a",
    startedAt: "2026-10-10T10:00:00.000Z",
    completedAt: "2026-10-10T10:10:00.000Z",
    players: [
      { playerId: "p1", teamId: "a", score: 40, eliminations: 2, assists: 1, experienceGranted: 0 },
      { playerId: "p2", teamId: "b", score: 20, eliminations: 1, assists: 0, experienceGranted: 0 }
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.rewardsApplied.length, 2);
  assert.ok(profiles.getOrCreate("p1").totalExperience > 0);
});

test("live operations state can disable ranked by region", () => {
  const service = new LiveOperationsService();
  const updated = service.update("west-africa", { rankedEnabled: false });
  assert.equal(updated.rankedEnabled, false);
  assert.equal(service.get("west-africa").matchmakingEnabled, true);
});
