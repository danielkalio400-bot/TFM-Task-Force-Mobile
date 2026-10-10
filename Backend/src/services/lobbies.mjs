import { randomUUID } from "node:crypto";

function clean(value, max = 128) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 && result.length <= max ? result : null;
}

export class LobbyService {
  #lobbies = new Map();

  create(input) {
    const ownerPlayerId = clean(input?.ownerPlayerId);
    const platform = clean(input?.platform, 24);
    const maxPlayers = Number.isInteger(input?.maxPlayers)
      ? Math.min(16, Math.max(1, input.maxPlayers))
      : 4;

    if (!ownerPlayerId || !["android", "ios", "windows"].includes(platform)) {
      return { ok: false, error: "invalid_lobby" };
    }

    const lobby = {
      lobbyId: randomUUID(),
      ownerPlayerId,
      maxPlayers,
      members: [{ playerId: ownerPlayerId, platform, ready: false }],
      createdAt: new Date().toISOString(),
    };
    this.#lobbies.set(lobby.lobbyId, lobby);
    return { ok: true, lobby: structuredClone(lobby) };
  }

  get(lobbyId) {
    const lobby = this.#lobbies.get(lobbyId);
    return lobby ? structuredClone(lobby) : null;
  }

  join(lobbyId, input) {
    const lobby = this.#lobbies.get(lobbyId);
    if (!lobby) return { ok: false, error: "lobby_not_found" };

    const playerId = clean(input?.playerId);
    const platform = clean(input?.platform, 24);
    if (!playerId || !["android", "ios", "windows"].includes(platform)) {
      return { ok: false, error: "invalid_member" };
    }
    if (lobby.members.some(member => member.playerId === playerId)) {
      return { ok: true, lobby: structuredClone(lobby) };
    }
    if (lobby.members.length >= lobby.maxPlayers) {
      return { ok: false, error: "lobby_full" };
    }

    lobby.members.push({ playerId, platform, ready: false });
    return { ok: true, lobby: structuredClone(lobby) };
  }

  leave(lobbyId, playerId) {
    const lobby = this.#lobbies.get(lobbyId);
    if (!lobby) return { ok: false, error: "lobby_not_found" };

    lobby.members = lobby.members.filter(member => member.playerId !== playerId);
    if (lobby.members.length === 0) {
      this.#lobbies.delete(lobbyId);
      return { ok: true, deleted: true };
    }

    if (lobby.ownerPlayerId === playerId) {
      lobby.ownerPlayerId = lobby.members[0].playerId;
    }

    return { ok: true, lobby: structuredClone(lobby) };
  }
}
