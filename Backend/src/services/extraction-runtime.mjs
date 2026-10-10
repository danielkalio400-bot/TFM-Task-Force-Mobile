import { randomUUID } from "node:crypto";

export class ExtractionRuntimeService {
  #sessions = new Map();

  create(input = {}) {
    const squadSize = Math.min(4, Math.max(1, Number(input.squadSize) || 1));
    const session = {
      matchId: String(input.matchId || randomUUID()),
      squadSize,
      activeSquadMembers: squadSize,
      contractsCompleted: 0,
      extractionAvailable: false,
      extracted: false,
      sessionEndsAt: new Date(Date.now() + Math.max(300, Number(input.durationSeconds) || 1200) * 1000).toISOString(),
    };
    this.#sessions.set(session.matchId, session);
    return { ok: true, runtime: { ...session } };
  }

  completeContract(matchId) {
    const session = this.#sessions.get(matchId);
    if (!session) return { ok: false, error: "extraction_runtime_not_found" };
    session.contractsCompleted++;
    session.extractionAvailable = session.contractsCompleted > 0;
    return { ok: true, runtime: { ...session } };
  }

  extract(matchId) {
    const session = this.#sessions.get(matchId);
    if (!session) return { ok: false, error: "extraction_runtime_not_found" };
    if (!session.extractionAvailable) return { ok: false, error: "extraction_not_available" };
    if (Date.parse(session.sessionEndsAt) <= Date.now())
      return { ok: false, error: "extraction_session_expired" };
    session.extracted = true;
    return { ok: true, runtime: { ...session } };
  }
}
