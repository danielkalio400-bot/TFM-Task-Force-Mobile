import { randomUUID } from "node:crypto";

function clean(value, max = 128) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result && result.length <= max ? result : null;
}

export class RegionalQueueService {
  #entries = new Map();

  join(input) {
    const playerId = clean(input?.playerId);
    const modeId = clean(input?.modeId, 64);
    const region = clean(input?.region, 64);
    const partySize = Number.isInteger(input?.partySize) ? input.partySize : 1;
    const skillRating = Number.isInteger(input?.skillRating) ? input.skillRating : 0;

    if (!playerId || !modeId || !region || partySize < 1 || partySize > 16 || skillRating < 0)
      return { ok: false, error: "invalid_queue_entry" };

    const existing = [...this.#entries.values()].find(
      entry => entry.playerId === playerId && entry.state === "searching"
    );
    if (existing) return { ok: false, error: "player_already_queued" };

    const entry = {
      queueEntryId: randomUUID(),
      playerId,
      modeId,
      region,
      partySize,
      skillRating,
      state: "searching",
      createdAt: new Date().toISOString(),
    };
    this.#entries.set(entry.queueEntryId, entry);
    return { ok: true, entry: { ...entry } };
  }

  cancel(queueEntryId) {
    const entry = this.#entries.get(queueEntryId);
    if (!entry) return { ok: false, error: "queue_entry_not_found" };
    if (entry.state === "searching") entry.state = "cancelled";
    return { ok: true, entry: { ...entry } };
  }

  listSearching(region, modeId) {
    return [...this.#entries.values()]
      .filter(entry => entry.state === "searching" && entry.region === region && entry.modeId === modeId)
      .sort((a, b) => a.skillRating - b.skillRating || a.createdAt.localeCompare(b.createdAt))
      .map(entry => ({ ...entry }));
  }

  markAssigned(queueEntryIds) {
    for (const id of queueEntryIds || []) {
      const entry = this.#entries.get(id);
      if (entry && entry.state === "searching") entry.state = "assigned";
    }
  }
}
