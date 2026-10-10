function tierForRating(rating) {
  if (rating >= 6000) return "elite";
  if (rating >= 4500) return "master";
  if (rating >= 3500) return "diamond";
  if (rating >= 2500) return "platinum";
  if (rating >= 1600) return "gold";
  if (rating >= 900) return "silver";
  if (rating >= 300) return "bronze";
  return "recruit";
}

export class RankedService {
  #states = new Map();

  get(playerId, seasonId = "preseason-1") {
    if (!this.#states.has(playerId)) {
      this.#states.set(playerId, {
        playerId,
        seasonId,
        rating: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      });
    }

    const state = this.#states.get(playerId);
    return { ...state, tier: tierForRating(state.rating) };
  }

  applyResult(playerId, won, opponentAverageRating = 0) {
    const state = this.get(playerId);
    const current = this.#states.get(playerId);
    const difference = Number(opponentAverageRating) - current.rating;
    const adjustment = Math.max(-8, Math.min(8, Math.trunc(difference / 100)));
    const delta = won ? 24 + adjustment : -18 + adjustment;

    current.rating = Math.max(0, current.rating + delta);
    current.matchesPlayed++;
    if (won) current.wins++;
    else current.losses++;

    return { ...current, tier: tierForRating(current.rating), ratingDelta: delta };
  }
}
