export class ServerDrainService {
  #states = new Map();

  request(serverId, mode, reasonCode = "") {
    if (typeof serverId !== "string" || !serverId.trim())
      return { ok: false, error: "invalid_server_id" };

    const allowed = new Set(["stop-new-assignments", "finish-current-matches", "immediate-maintenance"]);
    if (!allowed.has(mode)) return { ok: false, error: "invalid_drain_mode" };

    const state = {
      serverId: serverId.trim(),
      mode,
      reasonCode: String(reasonCode || "").slice(0, 128),
      requestedAt: new Date().toISOString(),
    };
    this.#states.set(state.serverId, state);
    return { ok: true, drain: { ...state } };
  }

  get(serverId) {
    const state = this.#states.get(serverId);
    return state ? { ...state } : null;
  }

  acceptsNewAssignments(serverId) {
    const state = this.#states.get(serverId);
    return !state;
  }
}
