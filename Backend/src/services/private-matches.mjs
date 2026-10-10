import { randomBytes, randomUUID } from "node:crypto";

function clean(value, max = 128) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

export class PrivateMatchService {
  #matches = new Map();

  create(input) {
    const ownerPlayerId = clean(input?.ownerPlayerId);
    const modeId = clean(input?.modeId, 64);
    const privacy = clean(input?.privacy, 32) || "invite-only";
    if (!ownerPlayerId || !modeId)
      return { ok: false, error: "invalid_private_match" };

    const match = {
      privateMatchId: randomUUID(),
      joinCode: privacy === "private-code" ? randomBytes(4).toString("hex").toUpperCase() : "",
      ownerPlayerId,
      modeId,
      privacy,
      maxPlayers: Math.min(100, Math.max(2, Number(input?.maxPlayers) || 10)),
      teamSize: Math.min(100, Math.max(1, Number(input?.teamSize) || 5)),
      allowBots: Boolean(input?.allowBots),
      allowSpectators: input?.allowSpectators !== false,
      allowJoinInProgress: Boolean(input?.allowJoinInProgress),
      members: [ownerPlayerId],
      createdAt: new Date().toISOString(),
    };

    this.#matches.set(match.privateMatchId, match);
    return { ok: true, match: structuredClone(match) };
  }

  get(id) {
    const match = this.#matches.get(id);
    return match ? structuredClone(match) : null;
  }

  join(id, playerId) {
    const match = this.#matches.get(id);
    if (!match) return { ok: false, error: "private_match_not_found" };
    const player = clean(playerId);
    if (!player) return { ok: false, error: "invalid_player" };
    if (match.members.includes(player)) return { ok: true, match: structuredClone(match) };
    if (match.members.length >= match.maxPlayers)
      return { ok: false, error: "private_match_full" };

    match.members.push(player);
    return { ok: true, match: structuredClone(match) };
  }
}
