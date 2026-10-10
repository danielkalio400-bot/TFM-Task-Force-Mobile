import { randomUUID } from "node:crypto";

const TYPES = new Set([
  "warning",
  "chat-restricted",
  "social-restricted",
  "matchmaking-restricted",
  "temporary-suspension",
  "permanent-suspension",
]);

export class ModerationSanctionService {
  #records = new Map();

  create(input) {
    const playerId = String(input?.playerId || "").trim();
    const type = String(input?.type || "").trim();
    const reasonCode = String(input?.reasonCode || "").trim().slice(0, 80);
    if (!playerId || !TYPES.has(type) || !reasonCode)
      return { ok: false, error: "invalid_moderation_sanction" };

    const startsAt = new Date().toISOString();
    const durationSeconds = Math.max(0, Number(input?.durationSeconds) || 0);
    const endsAt = type === "permanent-suspension" || durationSeconds <= 0
      ? null
      : new Date(Date.now() + durationSeconds * 1000).toISOString();

    const record = {
      sanctionId: randomUUID(),
      playerId,
      type,
      reasonCode,
      startsAt,
      endsAt,
      active: true,
    };
    this.#records.set(record.sanctionId, record);
    return { ok: true, sanction: { ...record } };
  }

  revoke(sanctionId) {
    const record = this.#records.get(sanctionId);
    if (!record) return { ok: false, error: "moderation_sanction_not_found" };
    record.active = false;
    return { ok: true, sanction: { ...record } };
  }

  activeFor(playerId) {
    const now = Date.now();
    return [...this.#records.values()]
      .filter(record =>
        record.playerId === playerId &&
        record.active &&
        (!record.endsAt || Date.parse(record.endsAt) > now)
      )
      .map(record => ({ ...record }));
  }

  blocksSocial(playerId) {
    return this.activeFor(playerId).some(record =>
      ["social-restricted", "temporary-suspension", "permanent-suspension"].includes(record.type)
    );
  }
}
