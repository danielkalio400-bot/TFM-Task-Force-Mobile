import { randomUUID } from "node:crypto";

export class AuthoritativeRecoveryService {
  #records = new Map();

  constructor(persistence) {
    this.persistence = persistence;
  }

  create(input, lifetimeSeconds = 120) {
    const matchId = String(input?.matchId || "").trim();
    const playerId = String(input?.playerId || "").trim();
    if (!matchId || !playerId) return { ok: false, error: "invalid_authoritative_recovery" };

    const snapshot = this.persistence.latest(matchId);
    if (!snapshot || snapshot.terminal)
      return { ok: false, error: "restorable_session_snapshot_not_found" };

    const recovery = {
      recoveryId: randomUUID(),
      matchId,
      playerId,
      sectionId: snapshot.sectionId,
      serverId: snapshot.serverId,
      runtimePhase: snapshot.runtimePhase,
      snapshotSequence: snapshot.sequence,
      expiresAt: new Date(Date.now() + Math.max(30, lifetimeSeconds) * 1000).toISOString(),
      consumed: false,
    };

    this.#records.set(recovery.recoveryId, recovery);
    return { ok: true, recovery: { ...recovery, restorable: true } };
  }

  consume(recoveryId, playerId) {
    const recovery = this.#records.get(recoveryId);
    if (!recovery) return { ok: false, error: "authoritative_recovery_not_found" };
    if (recovery.playerId !== playerId) return { ok: false, error: "authoritative_recovery_player_mismatch" };
    if (recovery.consumed) return { ok: false, error: "authoritative_recovery_consumed" };
    if (Date.parse(recovery.expiresAt) <= Date.now())
      return { ok: false, error: "authoritative_recovery_expired" };

    const snapshot = this.persistence.latest(recovery.matchId);
    if (!snapshot || snapshot.terminal || snapshot.sequence < recovery.snapshotSequence)
      return { ok: false, error: "authoritative_snapshot_unavailable" };

    recovery.consumed = true;
    return {
      ok: true,
      recovery: { ...recovery, restorable: true },
      snapshot,
    };
  }
}
