import { randomUUID } from "node:crypto";

const TYPES = new Set([
  "impossible-rate",
  "invalid-sequence",
  "position-mismatch",
  "inventory-mismatch",
  "match-integrity-mismatch",
  "repeated-disconnect-pattern",
]);

export class FairPlayService {
  #signals = [];

  record(input) {
    const playerId = String(input?.playerId || "").trim();
    const matchId = String(input?.matchId || "").trim();
    const type = String(input?.type || "").trim();
    const confidence01 = Math.max(0, Math.min(1, Number(input?.confidence01) || 0));

    if (!playerId || !matchId || !TYPES.has(type))
      return { ok: false, error: "invalid_fairplay_signal" };

    const signal = {
      signalId: randomUUID(),
      playerId,
      matchId,
      type,
      confidence01,
      reviewContext: String(input?.reviewContext || "").slice(0, 256),
      status: "review-pending",
      createdAt: new Date().toISOString(),
    };
    this.#signals.push(signal);
    return { ok: true, signal: { ...signal } };
  }

  pendingForPlayer(playerId) {
    return this.#signals
      .filter(signal => signal.playerId === playerId && signal.status === "review-pending")
      .map(signal => ({ ...signal }));
  }
}
