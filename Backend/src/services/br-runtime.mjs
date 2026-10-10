import { randomUUID } from "node:crypto";

export class BattleRoyaleRuntimeService {
  #matches = new Map();

  create(input = {}) {
    const connectedPlayers = Math.min(100, Math.max(1, Number(input.connectedPlayers) || 1));
    const state = {
      matchId: String(input.matchId || randomUUID()),
      connectedPlayers,
      activePlayers: connectedPlayers,
      activeTeams: Math.max(1, Number(input.activeTeams) || connectedPlayers),
      zoneStage: 0,
      zoneRadiusMeters: 1500,
      nextZoneRadiusMeters: 1000,
      secondsUntilZoneTransition: 120,
      finalStage: false,
    };
    this.#matches.set(state.matchId, state);
    return { ok: true, runtime: { ...state } };
  }

  get(matchId) {
    const state = this.#matches.get(matchId);
    return state ? { ...state } : null;
  }

  advance(matchId, seconds) {
    const state = this.#matches.get(matchId);
    if (!state) return { ok: false, error: "br_runtime_not_found" };
    if (state.finalStage) return { ok: true, runtime: { ...state } };

    state.secondsUntilZoneTransition = Math.max(0, state.secondsUntilZoneTransition - Math.max(0, Number(seconds) || 0));
    if (state.secondsUntilZoneTransition === 0) {
      state.zoneStage++;
      state.zoneRadiusMeters = state.nextZoneRadiusMeters;
      state.nextZoneRadiusMeters = Math.max(75, state.zoneRadiusMeters * 0.62);
      state.secondsUntilZoneTransition = Math.max(45, 120 - state.zoneStage * 8);
      state.finalStage = state.zoneRadiusMeters <= 100;
    }
    return { ok: true, runtime: { ...state } };
  }
}
