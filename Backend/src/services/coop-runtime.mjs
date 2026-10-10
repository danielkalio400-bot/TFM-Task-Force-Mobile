import { randomUUID } from "node:crypto";

export class CoopRuntimeService {
  #sessions = new Map();

  create(input = {}) {
    const session = {
      sessionId: String(input.sessionId || randomUUID()),
      variant: String(input.variant || "survival"),
      waveNumber: 1,
      participants: Math.min(16, Math.max(1, Number(input.participants) || 1)),
      remainingObjectives: Math.max(0, Number(input.remainingObjectives) || 1),
      intermissionSeconds: 0,
      completed: false,
    };
    this.#sessions.set(session.sessionId, session);
    return { ok: true, runtime: { ...session } };
  }

  completeObjective(sessionId, amount = 1) {
    const session = this.#sessions.get(sessionId);
    if (!session) return { ok: false, error: "coop_runtime_not_found" };
    session.remainingObjectives = Math.max(0, session.remainingObjectives - Math.max(1, Number(amount) || 1));
    return { ok: true, runtime: { ...session } };
  }

  advanceWave(sessionId, nextObjectiveCount = 1) {
    const session = this.#sessions.get(sessionId);
    if (!session) return { ok: false, error: "coop_runtime_not_found" };
    if (session.remainingObjectives > 0) return { ok: false, error: "objectives_remaining" };
    session.waveNumber++;
    session.remainingObjectives = Math.max(1, Number(nextObjectiveCount) || 1);
    session.intermissionSeconds = 20;
    return { ok: true, runtime: { ...session } };
  }
}
