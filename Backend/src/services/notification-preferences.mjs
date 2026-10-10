export class NotificationPreferenceService {
  #settings = new Map();

  get(playerId) {
    playerId = String(playerId || "").trim();
    if (!playerId) return null;
    if (!this.#settings.has(playerId)) {
      this.#settings.set(playerId, {
        playerId,
        match: true,
        friend: true,
        clan: true,
        security: true,
        moderation: true,
        system: true,
      });
    }
    return { ...this.#settings.get(playerId) };
  }

  update(playerId, input) {
    const current = this.get(playerId);
    if (!current) return { ok: false, error: "invalid_player_id" };

    for (const key of ["match", "friend", "clan", "system"]) {
      if (input?.[key] !== undefined) current[key] = Boolean(input[key]);
    }

    current.security = true;
    current.moderation = true;
    this.#settings.set(playerId, current);
    return { ok: true, settings: { ...current } };
  }

  allows(playerId, category) {
    const settings = this.get(playerId);
    return Boolean(settings?.[category]);
  }
}
