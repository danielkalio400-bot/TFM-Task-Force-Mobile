import { randomBytes, randomUUID } from "node:crypto";

export class ServerAssignmentService {
  #assignments = new Map();

  constructor(serverRegistry) {
    this.serverRegistry = serverRegistry;
  }

  assign(matchId, region, lifetimeSeconds = 90) {
    if (typeof matchId !== "string" || !matchId.trim() ||
        typeof region !== "string" || !region.trim()) {
      return { ok: false, error: "invalid_assignment_request" };
    }

    const server = this.serverRegistry.choose(region.trim());
    if (!server) return { ok: false, error: "no_ready_server" };

    const assignment = {
      assignmentId: randomUUID(),
      matchId: matchId.trim(),
      serverId: server.serverId,
      region: server.region,
      endpoint: server.endpoint,
      joinCredential: randomBytes(32).toString("base64url"),
      expiresAt: new Date(Date.now() + Math.max(30, lifetimeSeconds) * 1000).toISOString(),
    };

    this.#assignments.set(assignment.assignmentId, assignment);
    return { ok: true, assignment: { ...assignment } };
  }

  validate(assignmentId, credential) {
    const assignment = this.#assignments.get(assignmentId);
    if (!assignment) return { ok: false, error: "assignment_not_found" };
    if (assignment.joinCredential !== credential) return { ok: false, error: "invalid_join_credential" };
    if (Date.parse(assignment.expiresAt) <= Date.now()) return { ok: false, error: "join_credential_expired" };
    return { ok: true, assignment: { ...assignment } };
  }
}
