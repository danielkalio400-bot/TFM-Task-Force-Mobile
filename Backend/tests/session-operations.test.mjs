import test from "node:test";
import assert from "node:assert/strict";
import { RegionalQueueService } from "../src/services/regional-queues.mjs";
import { MatchSessionService } from "../src/services/match-sessions.mjs";
import { ServerDrainService } from "../src/services/server-draining.mjs";
import { IncidentService } from "../src/services/incidents.mjs";
import { FairPlayService } from "../src/services/fairplay.mjs";

test("regional queue rejects duplicate active queue entries", () => {
  const queues = new RegionalQueueService();
  const first = queues.join({
    playerId: "p1",
    modeId: "team-score",
    region: "west-africa",
    partySize: 1,
    skillRating: 1200,
  });
  assert.equal(first.ok, true);
  assert.equal(queues.join({
    playerId: "p1",
    modeId: "team-score",
    region: "west-africa",
    partySize: 1,
    skillRating: 1200,
  }).error, "player_already_queued");
});

test("match session enforces ordered lifecycle transitions", () => {
  const sessions = new MatchSessionService();
  const created = sessions.create({ modeId: "team-score", region: "west-africa" });
  assert.equal(created.ok, true);
  assert.equal(sessions.transition(created.session.matchId, "active").error, "invalid_match_transition");
  assert.equal(sessions.transition(created.session.matchId, "queueing").ok, true);
  assert.equal(sessions.transition(created.session.matchId, "server-assignment").ok, true);
});

test("draining server stops new assignment eligibility", () => {
  const drains = new ServerDrainService();
  assert.equal(drains.acceptsNewAssignments("s1"), true);
  assert.equal(drains.request("s1", "finish-current-matches", "maintenance").ok, true);
  assert.equal(drains.acceptsNewAssignments("s1"), false);
});

test("operations record incidents and fair-play review signals", () => {
  const incidents = new IncidentService();
  assert.equal(incidents.create({ service: "matchmaking", code: "degraded", severity: "major" }).ok, true);
  assert.equal(incidents.open().length, 1);

  const fairPlay = new FairPlayService();
  assert.equal(fairPlay.record({
    playerId: "p1",
    matchId: "m1",
    type: "match-integrity-mismatch",
    confidence01: 0.8,
  }).ok, true);
});
