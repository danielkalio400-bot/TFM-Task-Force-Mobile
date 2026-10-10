import { randomUUID } from "node:crypto";

export class RecoveryService {
  #records = new Map();

  issue(playerId, matchId, lifetimeSeconds = 120) {
    if (typeof playerId !== "string" || !playerId.trim() ||
        typeof matchId !== "string" || !matchId.trim()) {
      return { ok: false, error: "invalid_recovery_request" };
    }

    const now = Date.now();
    const record = {
      recoveryId: randomUUID(),
      playerId: playerId.trim(),
      matchId: matchId.trim(),
      state: "issued",
      expiresAt: new Date(now + Math.max(30, lifetimeSeconds) * 1000).toISOString(),
    };

    this.#records.set(record.recoveryId, record);
    return { ok: true, recovery: { ...record } };
  }

  consume(recoveryId, playerId) {
    const record = this.#records.get(recoveryId);
    if (!record) return { ok: false, error: "recovery_not_found" };

    if (record.playerId !== playerId) {
      return { ok: false, error: "recovery_player_mismatch" };
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      record.state = "expired";
      return { ok: false, error: "recovery_expired" };
    }

    if (record.state !== "issued") {
      return { ok: false, error: "recovery_not_available" };
    }

    record.state = "consumed";
    return { ok: true, recovery: { ...record } };
  }
}
