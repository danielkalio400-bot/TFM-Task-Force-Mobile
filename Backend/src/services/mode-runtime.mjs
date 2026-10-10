import { randomUUID } from "node:crypto";

const VALID_PHASES = new Set([
  "waiting",
  "warmup",
  "active",
  "sudden-death",
  "completed",
  "cancelled",
]);

export class ModeRuntimeService {
  #matches = new Map();

  create(input) {
    const modeId = String(input?.modeId || "").trim();
    const mapId = String(input?.mapId || "").trim();
    if (!modeId || !mapId) return { ok: false, error: "invalid_mode_runtime" };

    const state = {
      matchId: String(input?.matchId || randomUUID()),
      modeId,
      mapId,
      phase: "waiting",
      connectedPlayers: 0,
      alivePlayers: 0,
      elapsedSeconds: 0,
      teamAScore: 0,
      teamBScore: 0,
      winningTeamId: "",
      completionReason: "",
      updatedAt: new Date().toISOString(),
    };

    this.#matches.set(state.matchId, state);
    return { ok: true, runtime: { ...state } };
  }

  get(matchId) {
    const state = this.#matches.get(matchId);
    return state ? { ...state } : null;
  }

  update(matchId, patch) {
    const state = this.#matches.get(matchId);
    if (!state) return { ok: false, error: "mode_runtime_not_found" };

    if (patch?.phase !== undefined) {
      const phase = String(patch.phase);
      if (!VALID_PHASES.has(phase))
        return { ok: false, error: "invalid_mode_runtime_phase" };
      state.phase = phase;
    }

    for (const field of ["connectedPlayers", "alivePlayers", "teamAScore", "teamBScore"]) {
      if (patch?.[field] !== undefined) {
        state[field] = Math.max(0, Math.trunc(Number(patch[field]) || 0));
      }
    }
    if (patch?.elapsedSeconds !== undefined)
      state.elapsedSeconds = Math.max(0, Number(patch.elapsedSeconds) || 0);

    if (patch?.winningTeamId !== undefined)
      state.winningTeamId = String(patch.winningTeamId || "");
    if (patch?.completionReason !== undefined)
      state.completionReason = String(patch.completionReason || "").slice(0, 128);

    state.updatedAt = new Date().toISOString();
    return { ok: true, runtime: { ...state } };
  }
}
