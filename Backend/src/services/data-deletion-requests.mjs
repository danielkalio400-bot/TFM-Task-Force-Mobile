import { randomUUID } from "node:crypto";

export class DataDeletionRequestService {
  #requests = new Map();

  create(input) {
    const playerId = String(input?.playerId || "").trim();
    if (!playerId) return { ok: false, error: "invalid_player_id" };

    const request = {
      requestId: randomUUID(),
      playerId,
      state: "requested",
      requestedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.#requests.set(request.requestId, request);
    return { ok: true, request: { ...request } };
  }

  update(requestId, state) {
    const request = this.#requests.get(requestId);
    if (!request) return { ok: false, error: "deletion_request_not_found" };
    const allowed = new Set(["requested", "reviewing", "completed", "rejected"]);
    if (!allowed.has(state)) return { ok: false, error: "invalid_deletion_request_state" };

    request.state = state;
    request.completedAt = state === "completed" ? new Date().toISOString() : null;
    return { ok: true, request: { ...request } };
  }
}
