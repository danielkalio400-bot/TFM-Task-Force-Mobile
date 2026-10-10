export class IdentityAuditService {
  #events = [];

  record(input) {
    const event = {
      type: String(input?.type || "unknown").slice(0, 64),
      subjectRef: String(input?.subjectRef || "").slice(0, 128),
      playerId: String(input?.playerId || "").slice(0, 128),
      details: input?.details && typeof input.details === "object" ? { ...input.details } : {},
      recordedAt: new Date().toISOString(),
    };

    this.#events.push(event);
    if (this.#events.length > 500) this.#events.shift();
    return { ...event };
  }

  recent(limit = 50) {
    const count = Math.min(100, Math.max(1, Number(limit) || 50));
    return this.#events.slice(-count).map(event => ({ ...event, details: { ...event.details } }));
  }
}
