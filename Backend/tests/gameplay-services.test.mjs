import test from "node:test";
import assert from "node:assert/strict";
import { PartyService } from "../src/services/parties.mjs";
import { RewardService } from "../src/services/rewards.mjs";
import { ReconnectRestoreService } from "../src/services/reconnect-restores.mjs";
import { OperationsHealthService } from "../src/services/operations-health.mjs";
import { ServerRegistry } from "../src/services/server-registry.mjs";
import { IncidentService } from "../src/services/incidents.mjs";

test("party composition averages skill and tracks readiness", () => {
  const service = new PartyService();
  const created = service.create({
    playerId: "p1",
    platform: "android",
    skillRating: 1000,
    maximumMembers: 4,
  });
  service.join(created.party.partyId, {
    playerId: "p2",
    platform: "windows",
    skillRating: 1400,
  });
  service.setReady(created.party.partyId, "p1", true);
  service.setReady(created.party.partyId, "p2", true);

  const composition = service.composition(created.party.partyId);
  assert.equal(composition.size, 2);
  assert.equal(composition.averageSkillRating, 1200);
  assert.equal(composition.allReady, true);
});

test("reward grants are deterministic and idempotent per player and match", () => {
  const service = new RewardService();
  const first = service.calculate({
    matchId: "m1",
    playerId: "p1",
    score: 100,
    objectives: 2,
    won: true,
  });
  assert.equal(first.ok, true);
  assert.ok(first.reward.experience > 0);

  const duplicate = service.calculate({
    matchId: "m1",
    playerId: "p1",
    score: 100,
    objectives: 2,
    won: true,
  });
  assert.equal(duplicate.error, "reward_already_granted");
});

test("reconnect restore is player-bound and single use", () => {
  const service = new ReconnectRestoreService();
  const created = service.create({
    matchId: "m1",
    playerId: "p1",
    serverId: "s1",
    health: 70,
    score: 10,
  });

  assert.equal(created.ok, true);
  assert.equal(service.consume(created.restore.restoreId, "other").error, "restore_player_mismatch");
  assert.equal(service.consume(created.restore.restoreId, "p1").ok, true);
  assert.equal(service.consume(created.restore.restoreId, "p1").error, "restore_already_consumed");
});

test("operations health degrades when major incidents exist", () => {
  const servers = new ServerRegistry();
  servers.heartbeat({
    serverId: "s1",
    region: "west-africa",
    endpoint: "127.0.0.1:7777",
    capacity: 20,
    playerCount: 2,
    health: "ready",
  });

  const incidents = new IncidentService();
  const health = new OperationsHealthService({ servers, incidents });
  assert.equal(health.snapshot().gameServers, "healthy");

  incidents.create({
    service: "matchmaking",
    region: "west-africa",
    code: "degraded",
    severity: "major",
  });

  assert.equal(health.snapshot().gameServers, "degraded");
});
