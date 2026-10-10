export class RewardService {
  #grantedKeys = new Set();

  calculate(input) {
    const matchId = String(input?.matchId || "").trim();
    const playerId = String(input?.playerId || "").trim();
    const score = Math.max(0, Number(input?.score) || 0);
    const objectives = Math.max(0, Number(input?.objectives) || 0);
    const won = Boolean(input?.won);

    if (!matchId || !playerId) return { ok: false, error: "invalid_reward_request" };

    const key = `${matchId}:${playerId}`;
    if (this.#grantedKeys.has(key)) return { ok: false, error: "reward_already_granted" };

    const experience = 100 + score * 2 + objectives * 35 + (won ? 150 : 50);
    const softCredits = Math.min(5000, 40 + Math.floor(score / 5) + (won ? 30 : 10));
    const reward = {
      matchId,
      playerId,
      experience,
      softCredits,
      source: "validated-match-result",
    };

    this.#grantedKeys.add(key);
    return { ok: true, reward };
  }
}
