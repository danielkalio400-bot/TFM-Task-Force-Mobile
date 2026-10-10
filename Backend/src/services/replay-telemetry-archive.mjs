import { randomUUID } from "node:crypto";

export class ReplayTelemetryArchiveService {
  #events = new Map();
  #sealed = new Set();

  append(input) {
    const matchId = String(input?.matchId || "").trim();
    if (!matchId) return { ok: false, error: "invalid_replay_match" };
    if (this.#sealed.has(matchId)) return { ok: false, error: "replay_telemetry_sealed" };

    const sequence = Math.trunc(Number(input?.sequence) || 0);
    const matchTimeMilliseconds = Math.max(0, Math.trunc(Number(input?.matchTimeMilliseconds) || 0));
    const eventType = String(input?.eventType || "").trim().slice(0, 64);
    if (sequence < 1 || !eventType)
      return { ok: false, error: "invalid_replay_event" };

    if (!this.#events.has(matchId)) this.#events.set(matchId, []);
    const events = this.#events.get(matchId);
    if (events.some(event => event.sequence === sequence))
      return { ok: false, error: "duplicate_replay_sequence" };

    const expected = events.length ? events[events.length - 1].sequence + 1 : 1;
    if (sequence !== expected)
      return { ok: false, error: "replay_sequence_gap" };

    const event = {
      eventId: randomUUID(),
      matchId,
      sequence,
      matchTimeMilliseconds,
      eventType,
      actorPlayerId: String(input?.actorPlayerId || "").trim(),
      targetPlayerId: String(input?.targetPlayerId || "").trim(),
      objectiveId: String(input?.objectiveId || "").trim(),
      metadataTag: String(input?.metadataTag || "").trim().slice(0, 160),
      recordedAt: new Date().toISOString(),
    };
    events.push(event);
    return { ok: true, event: { ...event } };
  }

  seal(matchId) {
    const id = String(matchId || "").trim();
    const events = this.#events.get(id);
    if (!id || !events || events.length === 0)
      return { ok: false, error: "replay_telemetry_not_found" };

    this.#sealed.add(id);
    return { ok: true, manifest: this.manifest(id) };
  }

  manifest(matchId) {
    const id = String(matchId || "").trim();
    const events = this.#events.get(id) || [];
    return {
      matchId: id,
      eventCount: events.length,
      firstSequence: events.length ? events[0].sequence : 0,
      lastSequence: events.length ? events[events.length - 1].sequence : 0,
      complete: this.#sealed.has(id),
      validationState: this.#sealed.has(id) ? "sealed" : "open",
    };
  }

  read(matchId, fromSequence = 1, limit = 250) {
    const start = Math.max(1, Math.trunc(Number(fromSequence) || 1));
    const count = Math.min(1000, Math.max(1, Math.trunc(Number(limit) || 250)));
    return (this.#events.get(String(matchId || "")) || [])
      .filter(event => event.sequence >= start)
      .slice(0, count)
      .map(event => ({ ...event }));
  }
}
