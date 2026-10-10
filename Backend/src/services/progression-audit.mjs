export class ProgressionAuditService {
  #events = [];

  record(input) {
    const event = {
      playerId: String(input?.playerId || "").trim(),
      grantId: String(input?.grantId || "").trim(),
      sourceType: String(input?.sourceType || "").trim(),
      sourceId: String(input?.sourceId || "").trim(),
      experience: Math.max(0, Math.trunc(Number(input?.experience) || 0)),
      softCredits: Math.max(0, Math.trunc(Number(input?.softCredits) || 0)),
      levelAfter: Math.max(1, Math.trunc(Number(input?.levelAfter) || 1)),
      totalExperienceAfter: Math.max(0, Math.trunc(Number(input?.totalExperienceAfter) || 0)),
      recordedAt: new Date().toISOString(),
    };

    if (!event.playerId || !event.grantId) return { ok: false, error: "invalid_progression_audit_event" };
    this.#events.push(event);
    if (this.#events.length > 5000) this.#events.shift();
    return { ok: true, event: { ...event } };
  }

  list(playerId, limit = 50) {
    const id = String(playerId || "").trim();
    const count = Math.min(200, Math.max(1, Math.trunc(Number(limit) || 50)));
    return this.#events
      .filter(event => !id || event.playerId === id)
      .slice(-count)
      .map(event => ({ ...event }));
  }
}
