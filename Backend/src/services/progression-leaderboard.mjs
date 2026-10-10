export class ProgressionLeaderboardService {
  #entries = new Map();

  update(progression) {
    if (!progression?.playerId) return { ok: false, error: "invalid_progression_snapshot" };
    this.#entries.set(progression.playerId, {
      playerId: progression.playerId,
      level: Math.max(1, Math.trunc(Number(progression.level) || 1)),
      totalExperience: Math.max(0, Math.trunc(Number(progression.totalExperience) || 0)),
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  }

  top(limit = 100) {
    const count = Math.min(100, Math.max(1, Math.trunc(Number(limit) || 25)));
    return [...this.#entries.values()]
      .sort((a, b) =>
        b.totalExperience - a.totalExperience ||
        b.level - a.level ||
        a.playerId.localeCompare(b.playerId)
      )
      .slice(0, count)
      .map((entry, index) => ({ rank: index + 1, ...entry }));
  }
}
