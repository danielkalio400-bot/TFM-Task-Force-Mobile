import { randomUUID } from "node:crypto";

const TRANSITIONS = new Map([
  ["idle", new Set(["checking-content"])],
  ["checking-content", new Set(["checking-map", "failed"])],
  ["checking-map", new Set(["creating-session", "failed"])],
  ["creating-session", new Set(["allocating-server", "failed"])],
  ["allocating-server", new Set(["connecting", "failed"])],
  ["connecting", new Set(["active", "recovering", "failed"])],
  ["active", new Set(["results", "recovering", "failed"])],
  ["recovering", new Set(["active", "failed"])],
  ["results", new Set(["returning", "failed"])],
  ["returning", new Set(["idle"])],
  ["failed", new Set(["idle"])],
]);

export class SectionLifecycleService {
  #states = new Map();

  create(input) {
    const sectionId = String(input?.sectionId || "").trim();
    const modeId = String(input?.modeId || "").trim();
    const mapId = String(input?.mapId || "").trim();
    if (!sectionId || !modeId || !mapId)
      return { ok: false, error: "invalid_section_lifecycle" };

    const state = {
      lifecycleId: randomUUID(),
      sectionId,
      modeId,
      mapId,
      matchId: String(input?.matchId || "").trim(),
      phase: "idle",
      failureCode: "",
      updatedAt: new Date().toISOString(),
    };
    this.#states.set(state.lifecycleId, state);
    return { ok: true, lifecycle: { ...state } };
  }

  get(lifecycleId) {
    const state = this.#states.get(lifecycleId);
    return state ? { ...state } : null;
  }

  move(lifecycleId, next, failureCode = "") {
    const state = this.#states.get(lifecycleId);
    if (!state) return { ok: false, error: "section_lifecycle_not_found" };
    const allowed = TRANSITIONS.get(state.phase) || new Set();
    if (!allowed.has(next)) return { ok: false, error: "invalid_section_lifecycle_transition" };

    state.phase = next;
    state.failureCode = next === "failed" ? String(failureCode || "").slice(0, 128) : "";
    state.updatedAt = new Date().toISOString();
    return { ok: true, lifecycle: { ...state } };
  }
}
