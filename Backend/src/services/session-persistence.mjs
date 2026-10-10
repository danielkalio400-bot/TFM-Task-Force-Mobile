import { randomUUID } from "node:crypto";

export class SessionPersistenceService {
  #latestByMatch = new Map();

  save(input) {
    const matchId = String(input?.matchId || "").trim();
    const sectionId = String(input?.sectionId || "").trim();
    const modeId = String(input?.modeId || "").trim();
    const mapId = String(input?.mapId || "").trim();
    if (!matchId || !sectionId || !modeId || !mapId)
      return { ok: false, error: "invalid_session_snapshot" };

    const previous = this.#latestByMatch.get(matchId);
    const sequence = (previous?.sequence || 0) + 1;
    const snapshot = {
      snapshotId: randomUUID(),
      matchId,
      sectionId,
      modeId,
      mapId,
      region: String(input?.region || "").trim(),
      serverId: String(input?.serverId || "").trim(),
      runtimePhase: String(input?.runtimePhase || "").trim(),
      sequence,
      capturedAt: new Date().toISOString(),
      terminal: Boolean(input?.terminal),
    };

    this.#latestByMatch.set(matchId, snapshot);
    return { ok: true, snapshot: { ...snapshot } };
  }

  latest(matchId) {
    const snapshot = this.#latestByMatch.get(matchId);
    return snapshot ? { ...snapshot } : null;
  }
}
