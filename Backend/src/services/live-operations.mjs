export class LiveOperationsService {
  #regions = new Map();

  get(region) {
    const key = String(region || "west-africa").trim() || "west-africa";
    if (!this.#regions.has(key)) {
      this.#regions.set(key, {
        region: key,
        matchmakingEnabled: true,
        rankedEnabled: true,
        privateMatchesEnabled: true,
        newServerAssignmentsEnabled: true,
        maintenanceMessage: "",
        updatedAt: new Date().toISOString(),
      });
    }
    return { ...this.#regions.get(key) };
  }

  update(region, patch) {
    const current = this.get(region);
    const next = {
      ...current,
      matchmakingEnabled: patch?.matchmakingEnabled ?? current.matchmakingEnabled,
      rankedEnabled: patch?.rankedEnabled ?? current.rankedEnabled,
      privateMatchesEnabled: patch?.privateMatchesEnabled ?? current.privateMatchesEnabled,
      newServerAssignmentsEnabled: patch?.newServerAssignmentsEnabled ?? current.newServerAssignmentsEnabled,
      maintenanceMessage: String(patch?.maintenanceMessage ?? current.maintenanceMessage).slice(0, 240),
      updatedAt: new Date().toISOString(),
    };
    this.#regions.set(next.region, next);
    return { ...next };
  }
}
