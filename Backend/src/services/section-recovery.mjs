import { randomUUID } from "node:crypto";

const SECTIONS = new Set(["multiplayer", "battle-royale", "zombies", "dmz-recon"]);

export class SectionRecoveryService {
  #records = new Map();

  create(input, lifetimeSeconds = 120) {
    const matchId = String(input?.matchId || "").trim();
    const playerId = String(input?.playerId || "").trim();
    const sectionId = String(input?.sectionId || "").trim();
    const serverId = String(input?.serverId || "").trim();

    if (!matchId || !playerId || !serverId || !SECTIONS.has(sectionId))
      return { ok: false, error: "invalid_section_recovery" };

    const recovery = {
      recoveryId: randomUUID(),
      matchId,
      playerId,
      sectionId,
      serverId,
      mapId: String(input?.mapId || "").trim(),
      runtimePhase: String(input?.runtimePhase || "").trim(),
      score: Math.max(0, Math.trunc(Number(input?.score) || 0)),
      health: Math.max(0, Math.trunc(Number(input?.health) || 0)),
      expiresAt: new Date(Date.now() + Math.max(30, lifetimeSeconds) * 1000).toISOString(),
      consumed: false,
    };

    this.#records.set(recovery.recoveryId, recovery);
    return { ok: true, recovery: { ...recovery } };
  }

  consume(recoveryId, playerId) {
    const recovery = this.#records.get(recoveryId);
    if (!recovery) return { ok: false, error: "section_recovery_not_found" };
    if (recovery.playerId !== playerId) return { ok: false, error: "section_recovery_player_mismatch" };
    if (recovery.consumed) return { ok: false, error: "section_recovery_consumed" };
    if (Date.parse(recovery.expiresAt) <= Date.now())
      return { ok: false, error: "section_recovery_expired" };

    recovery.consumed = true;
    return { ok: true, recovery: { ...recovery } };
  }
}
