function clean(value, max = 128) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 && result.length <= max ? result : null;
}

function levelForExperience(totalExperience) {
  let remaining = Math.max(0, Number(totalExperience) || 0);
  let level = 1;
  while (level < 1000) {
    const needed = 800 + (level - 1) * 250;
    if (remaining < needed) return level;
    remaining -= needed;
    level++;
  }
  return level;
}

export class ProfileService {
  #profiles = new Map();

  getOrCreate(playerId) {
    const id = clean(playerId);
    if (!id) return null;

    if (!this.#profiles.has(id)) {
      this.#profiles.set(id, {
        playerId: id,
        totalExperience: 0,
        softCredits: 0,
      });
    }

    const profile = this.#profiles.get(id);
    return {
      playerId: profile.playerId,
      totalExperience: profile.totalExperience,
      level: levelForExperience(profile.totalExperience),
      softCredits: profile.softCredits,
    };
  }

  grant(playerId, input) {
    const profile = this.getOrCreate(playerId);
    if (!profile) return { ok: false, error: "invalid_player" };

    const experience = Number.isInteger(input?.experience)
      ? Math.max(0, input.experience)
      : 0;
    const credits = Number.isInteger(input?.credits)
      ? Math.max(0, input.credits)
      : 0;

    const stored = this.#profiles.get(playerId);
    stored.totalExperience += experience;
    stored.softCredits += credits;

    return { ok: true, progression: this.getOrCreate(playerId) };
  }
}
