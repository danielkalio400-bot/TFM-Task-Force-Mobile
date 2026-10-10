import { randomUUID } from "node:crypto";

export class ProgressionAuthorityService {
  #processed = new Map();

  constructor({ profiles, audit, unlocks, leaderboard, contract }) {
    this.profiles = profiles;
    this.audit = audit;
    this.unlocks = unlocks;
    this.leaderboard = leaderboard;
    this.trustedSources = new Set(contract?.trustedSourceTypes || []);
  }

  grant(input) {
    const playerId = String(input?.playerId || "").trim();
    const sourceType = String(input?.sourceType || "").trim();
    const sourceId = String(input?.sourceId || "").trim();
    if (!playerId || !sourceId || !this.trustedSources.has(sourceType))
      return { ok: false, error: "untrusted_or_invalid_progression_source" };

    const idempotencyKey = `${sourceType}:${sourceId}:${playerId}`;
    if (this.#processed.has(idempotencyKey)) {
      return {
        ok: true,
        duplicate: true,
        receipt: { ...this.#processed.get(idempotencyKey).receipt },
        progression: { ...this.#processed.get(idempotencyKey).progression },
        unlocks: this.unlocks.list(playerId),
      };
    }

    const experience = Math.max(0, Math.trunc(Number(input?.experience) || 0));
    const softCredits = Math.max(0, Math.trunc(Number(input?.softCredits) || 0));
    const applied = this.profiles.grant(playerId, {
      experience,
      credits: softCredits,
    });
    if (!applied.ok) return applied;

    const receipt = {
      grantId: randomUUID(),
      playerId,
      sourceType,
      sourceId,
      experience,
      softCredits,
      grantedAt: new Date().toISOString(),
    };

    const unlockResult = this.unlocks.evaluate(playerId, applied.progression.level);
    this.leaderboard.update(applied.progression);
    this.audit.record({
      playerId,
      grantId: receipt.grantId,
      sourceType,
      sourceId,
      experience,
      softCredits,
      levelAfter: applied.progression.level,
      totalExperienceAfter: applied.progression.totalExperience,
    });

    const stored = {
      receipt,
      progression: applied.progression,
    };
    this.#processed.set(idempotencyKey, stored);

    return {
      ok: true,
      duplicate: false,
      receipt: { ...receipt },
      progression: { ...applied.progression },
      unlocks: unlockResult.all,
      newlyGrantedUnlocks: unlockResult.newlyGranted,
    };
  }
}
