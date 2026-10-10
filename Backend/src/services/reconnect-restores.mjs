import { randomUUID } from "node:crypto";

export class ReconnectRestoreService {
  #records = new Map();

  create(input, lifetimeSeconds = 120) {
    const matchId = String(input?.matchId || "").trim();
    const playerId = String(input?.playerId || "").trim();
    const serverId = String(input?.serverId || "").trim();

    if (!matchId || !playerId || !serverId)
      return { ok: false, error: "invalid_restore_request" };

    const record = {
      restoreId: randomUUID(),
      matchId,
      playerId,
      serverId,
      teamId: String(input?.teamId || "").trim(),
      score: Math.max(0, Number(input?.score) || 0),
      health: Math.max(0, Number(input?.health) || 0),
      expiresAt: new Date(Date.now() + Math.max(30, lifetimeSeconds) * 1000).toISOString(),
      consumed: false,
    };

    this.#records.set(record.restoreId, record);
    return { ok: true, restore: { ...record } };
  }

  consume(restoreId, playerId) {
    const record = this.#records.get(restoreId);
    if (!record) return { ok: false, error: "restore_not_found" };
    if (record.playerId !== playerId) return { ok: false, error: "restore_player_mismatch" };
    if (record.consumed) return { ok: false, error: "restore_already_consumed" };
    if (Date.parse(record.expiresAt) <= Date.now()) return { ok: false, error: "restore_expired" };

    record.consumed = true;
    return { ok: true, restore: { ...record } };
  }
}
