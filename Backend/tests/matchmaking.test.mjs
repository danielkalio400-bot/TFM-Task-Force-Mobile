import test from "node:test";
import assert from "node:assert/strict";
import { MatchmakingService } from "../src/services/matchmaking.mjs";

test("matchmaking pairs compatible searching tickets", () => {
  const service = new MatchmakingService(["mp", "br"]);
  const first = service.createTicket({
    playerId: "player-a",
    sectionId: "mp",
    playlist: "team",
    platform: "android",
    region: "west-africa",
  });
  const second = service.createTicket({
    playerId: "player-b",
    sectionId: "mp",
    playlist: "team",
    platform: "windows",
    region: "west-africa",
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);

  const a = service.getTicket(first.ticket.ticketId);
  const b = service.getTicket(second.ticket.ticketId);
  assert.equal(a.status, "matched");
  assert.equal(b.status, "matched");
  assert.equal(a.matchId, b.matchId);

  const match = service.getMatch(a.matchId);
  assert.deepEqual(match.playerIds, ["player-a", "player-b"]);
  assert.equal(match.state, "ready");
});

test("matchmaking rejects invalid tickets and duplicate searches", () => {
  const service = new MatchmakingService(["mp"]);
  assert.equal(service.createTicket({}).ok, false);

  const first = service.createTicket({
    playerId: "player-a",
    sectionId: "mp",
    playlist: "team",
    platform: "ios",
    region: "west-africa",
  });
  assert.equal(first.ok, true);

  const duplicate = service.createTicket({
    playerId: "player-a",
    sectionId: "mp",
    playlist: "team",
    platform: "ios",
    region: "west-africa",
  });
  assert.deepEqual(duplicate, { ok: false, error: "player_already_searching" });
});
