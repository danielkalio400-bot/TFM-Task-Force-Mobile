export class DedicatedSessionCoordinator {
  constructor({ liveOperations, assignments, lifecycles, persistence }) {
    this.liveOperations = liveOperations;
    this.assignments = assignments;
    this.lifecycles = lifecycles;
    this.persistence = persistence;
  }

  allocate(input) {
    const lifecycleId = String(input?.lifecycleId || "").trim();
    const matchId = String(input?.matchId || "").trim();
    const sectionId = String(input?.sectionId || "").trim();
    const modeId = String(input?.modeId || "").trim();
    const mapId = String(input?.mapId || "").trim();
    const region = String(input?.region || "west-africa").trim();

    if (!lifecycleId || !matchId || !sectionId || !modeId || !mapId)
      return { ok: false, error: "invalid_dedicated_session_request" };

    const lifecycle = this.lifecycles.get(lifecycleId);
    if (!lifecycle) return { ok: false, error: "section_lifecycle_not_found" };
    if (lifecycle.phase !== "allocating-server")
      return { ok: false, error: "lifecycle_not_ready_for_allocation" };

    const ops = this.liveOperations.get(region);
    if (!ops.matchmakingEnabled || !ops.newServerAssignmentsEnabled)
      return { ok: false, error: "regional_server_assignment_disabled" };

    const assigned = this.assignments.assign(matchId, region);
    if (!assigned.ok) return assigned;

    const moved = this.lifecycles.move(lifecycleId, "connecting");
    if (!moved.ok) return moved;

    const snapshot = this.persistence.save({
      matchId,
      sectionId,
      modeId,
      mapId,
      region,
      serverId: assigned.assignment.serverId,
      runtimePhase: "connecting",
    });

    return {
      ok: true,
      allocation: {
        allocationId: assigned.assignment.assignmentId,
        matchId,
        sectionId,
        region,
        serverId: assigned.assignment.serverId,
        endpoint: assigned.assignment.endpoint,
        joinCredential: assigned.assignment.joinCredential,
        expiresAt: assigned.assignment.expiresAt,
      },
      snapshot: snapshot.snapshot,
      lifecycle: moved.lifecycle,
    };
  }
}
