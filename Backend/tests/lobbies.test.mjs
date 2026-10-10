import test from "node:test";
import assert from "node:assert/strict";
import { LobbyService } from "../src/services/lobbies.mjs";

test("lobby owner can create and another player can join", () => {
  const service = new LobbyService();
  const created = service.create({
    ownerPlayerId: "owner",
    platform: "android",
    maxPlayers: 4,
  });

  assert.equal(created.ok, true);
  const joined = service.join(created.lobby.lobbyId, {
    playerId: "guest",
    platform: "windows",
  });

  assert.equal(joined.ok, true);
  assert.equal(joined.lobby.members.length, 2);
  assert.equal(joined.lobby.ownerPlayerId, "owner");
});

test("lobby tracks per-member readiness", () => {
  const service = new LobbyService();
  const created = service.create({ ownerPlayerId: "a", platform: "ios", maxPlayers: 2 });
  service.join(created.lobby.lobbyId, { playerId: "b", platform: "android" });

  assert.equal(service.allReady(created.lobby.lobbyId), false);
  service.setReady(created.lobby.lobbyId, "a", true);
  service.setReady(created.lobby.lobbyId, "b", true);
  assert.equal(service.allReady(created.lobby.lobbyId), true);
});

test("owner transfer occurs when the owner leaves", () => {
  const service = new LobbyService();
  const created = service.create({ ownerPlayerId: "a", platform: "ios", maxPlayers: 2 });
  service.join(created.lobby.lobbyId, { playerId: "b", platform: "android" });

  const result = service.leave(created.lobby.lobbyId, "a");
  assert.equal(result.ok, true);
  assert.equal(result.lobby.ownerPlayerId, "b");
});
