export class ProgressionUnlockService {
  #granted = new Map();

  constructor(rules = []) {
    this.rules = [...rules]
      .map(rule => ({
        unlockId: String(rule.unlockId || "").trim(),
        requiredLevel: Math.max(1, Math.trunc(Number(rule.requiredLevel) || 1)),
      }))
      .filter(rule => rule.unlockId);
  }

  evaluate(playerId, level) {
    const id = String(playerId || "").trim();
    if (!id) return { ok: false, error: "invalid_player" };

    if (!this.#granted.has(id)) this.#granted.set(id, new Map());
    const grants = this.#granted.get(id);
    const newlyGranted = [];
    const now = new Date().toISOString();

    for (const rule of this.rules) {
      if (level < rule.requiredLevel || grants.has(rule.unlockId)) continue;
      const state = {
        unlockId: rule.unlockId,
        requiredLevel: rule.requiredLevel,
        granted: true,
        grantedAt: now,
      };
      grants.set(rule.unlockId, state);
      newlyGranted.push({ ...state });
    }

    return {
      ok: true,
      newlyGranted,
      all: [...grants.values()].map(value => ({ ...value })),
    };
  }

  list(playerId) {
    const grants = this.#granted.get(String(playerId || "").trim());
    return grants ? [...grants.values()].map(value => ({ ...value })) : [];
  }
}
