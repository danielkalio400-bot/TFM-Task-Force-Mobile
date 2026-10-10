import test from "node:test";
import assert from "node:assert/strict";
import { ServerRegistry } from "../src/services/server-registry.mjs";
import { ServerAssignmentService } from "../src/services/server-assignments.mjs";
import { MapVoteService } from "../src/services/map-votes.mjs";
import { PerformanceTelemetryService } from "../src/services/performance-telemetry.mjs";

test("ready server is selected and receives an expiring assignment", () => {
  const registry = new ServerRegistry();
  registry.heartbeat({
    serverId: "server-1",
    region: "west-africa",
    endpoint: "127.0.0.1:7777",
    capacity: 20,
    playerCount: 4,
    health: "ready",
  });

  const assignments = new ServerAssignmentService(registry);
  const result = assignments.assign("match-1", "west-africa");
  assert.equal(result.ok, true);
  assert.equal(result.assignment.serverId, "server-1");
  assert.ok(result.assignment.joinCredential.length > 20);
});

test("map vote enforces one vote per player and deterministic finalization", () => {
  const service = new MapVoteService();
  const created = service.create({
    matchId: "match-1",
    modeId: "team-score",
    options: ["map-a", "map-b", "map-c"],
  });
  assert.equal(created.ok, true);

  assert.equal(service.cast(created.vote.voteId, "p1", "map-b").ok, true);
  assert.equal(service.cast(created.vote.voteId, "p1", "map-a").error, "player_already_voted");
  assert.equal(service.finalize(created.vote.voteId).vote.selectedMapId, "map-b");
});

test("performance telemetry produces bounded summary metrics", () => {
  const service = new PerformanceTelemetryService();
  service.record({ frameTimeMs: 16, roundTripMs: 45, jitterMs: 3, packetLoss01: 0.01 });
  service.record({ frameTimeMs: 20, roundTripMs: 55, jitterMs: 5, packetLoss01: 0.02 });

  const summary = service.summary();
  assert.equal(summary.samples, 2);
  assert.equal(summary.averageRoundTripMs, 50);
});
