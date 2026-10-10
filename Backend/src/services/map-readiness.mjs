export class MapReadinessService {
  #records = new Map();

  constructor(mapCatalog) {
    this.mapCatalog = mapCatalog;
  }

  get(mapId) {
    const map = this.mapCatalog.get(mapId);
    if (!map) return null;

    if (!this.#records.has(mapId)) {
      this.#records.set(mapId, {
        mapId,
        state: "concept-only",
        gameplayValidated: false,
        navigationValidated: false,
        performanceValidatedMobile: false,
        performanceValidatedPc: false,
        lightingValidated: false,
        audioValidated: false,
        qaValidated: false,
        lastFailureCode: "",
      });
    }
    return { ...this.#records.get(mapId) };
  }

  update(mapId, patch) {
    const current = this.get(mapId);
    if (!current) return { ok: false, error: "map_not_found" };

    const allowedStates = new Set([
      "concept-only",
      "blockout",
      "gameplay-prototype",
      "content-complete",
      "mobile-validation",
      "pc-validation",
      "release-candidate",
      "released",
    ]);

    const nextState = String(patch?.state ?? current.state);
    if (!allowedStates.has(nextState))
      return { ok: false, error: "invalid_map_readiness_state" };

    const boolFields = [
      "gameplayValidated",
      "navigationValidated",
      "performanceValidatedMobile",
      "performanceValidatedPc",
      "lightingValidated",
      "audioValidated",
      "qaValidated",
    ];

    const next = { ...current, state: nextState };
    for (const field of boolFields) {
      if (patch?.[field] !== undefined) next[field] = Boolean(patch[field]);
    }
    next.lastFailureCode = String(patch?.lastFailureCode ?? current.lastFailureCode).slice(0, 128);
    this.#records.set(mapId, next);
    return { ok: true, readiness: this.describe(next) };
  }

  describe(record) {
    const releaseReady =
      ["release-candidate", "released"].includes(record.state) &&
      record.gameplayValidated &&
      record.navigationValidated &&
      record.performanceValidatedMobile &&
      record.performanceValidatedPc &&
      record.lightingValidated &&
      record.audioValidated &&
      record.qaValidated;

    const prototypeReady =
      ["gameplay-prototype", "content-complete", "mobile-validation", "pc-validation", "release-candidate", "released"].includes(record.state) &&
      record.gameplayValidated &&
      record.navigationValidated;

    return { ...record, prototypeReady, releaseReady };
  }
}
