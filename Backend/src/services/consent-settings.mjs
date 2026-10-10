export class ConsentSettingsService {
  #settings = new Map();

  get(playerId) {
    playerId = String(playerId || "").trim();
    if (!playerId) return null;

    if (!this.#settings.has(playerId)) {
      this.#settings.set(playerId, {
        playerId,
        socialDiscovery: true,
        directMessages: true,
        voiceChat: true,
        crossServiceIntegration: false,
        personalizedRecommendations: false,
        updatedAt: new Date().toISOString(),
      });
    }
    return { ...this.#settings.get(playerId) };
  }

  update(playerId, input) {
    const current = this.get(playerId);
    if (!current) return { ok: false, error: "invalid_player_id" };

    for (const key of [
      "socialDiscovery",
      "directMessages",
      "voiceChat",
      "crossServiceIntegration",
      "personalizedRecommendations",
    ]) {
      if (input?.[key] !== undefined) current[key] = Boolean(input[key]);
    }
    current.updatedAt = new Date().toISOString();
    this.#settings.set(playerId, current);
    return { ok: true, settings: { ...current } };
  }
}
