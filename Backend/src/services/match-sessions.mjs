import { randomUUID } from "node:crypto";

const TRANSITIONS = new Map([
  ["lobby", new Set(["queueing", "failed"])],
  ["queueing", new Set(["server-assignment", "lobby", "failed"])],
  ["server-assignment", new Set(["connecting", "failed"])],
  ["connecting", new Set(["warmup", "failed"])],
  ["warmup", new Set(["active", "failed"])],
  ["active", new Set(["results", "failed"])],
  ["results", new Set(["returning", "failed"])],
  ["returning", new Set(["lobby"])],
  ["failed", new Set(["lobby"])],
]);

export class MatchSessionService {
  #sessions = new Map();

  create({ modeId, region }) {
    if (typeof modeId !== "string" || !modeId.trim() ||
        typeof region !== "string" || !region.trim()) {
      return { ok: false, error: "invalid_match_session" };
    }

    const session = {
      matchId: randomUUID(),
      modeId: modeId.trim(),
      region: region.trim(),
      serverId: "",
      phase: "lobby",
      failureCode: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.#sessions.set(session.matchId, session);
    return { ok: true, session: { ...session } };
  }

  get(matchId) {
    const session = this.#sessions.get(matchId);
    return session ? { ...session } : null;
  }

  transition(matchId, next, extras = {}) {
    const session = this.#sessions.get(matchId);
    if (!session) return { ok: false, error: "match_session_not_found" };

    const allowed = TRANSITIONS.get(session.phase) || new Set();
    if (!allowed.has(next)) return { ok: false, error: "invalid_match_transition" };

    session.phase = next;
    if (typeof extras.serverId === "string") session.serverId = extras.serverId.trim();
    session.failureCode = next === "failed" ? String(extras.failureCode || "") : "";
    session.updatedAt = new Date().toISOString();
    return { ok: true, session: { ...session } };
  }
}
