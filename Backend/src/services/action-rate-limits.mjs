export class ActionRateLimitService {
  #buckets = new Map();

  constructor(defaults = {}) {
    this.defaults = defaults;
  }

  consume(playerId, actionKey, nowMs = Date.now()) {
    playerId = String(playerId || "").trim();
    actionKey = String(actionKey || "").trim();
    if (!playerId || !actionKey) return { ok: false, error: "invalid_rate_limit_subject" };

    const policy = this.defaults[actionKey];
    if (!policy) return { ok: false, error: "unknown_rate_limited_action" };

    const key = playerId + ":" + actionKey;
    let bucket = this.#buckets.get(key);
    if (!bucket || nowMs >= bucket.windowEndsAtMs) {
      bucket = {
        playerId,
        actionKey,
        limit: Math.max(1, Number(policy.limit) || 1),
        used: 0,
        windowEndsAtMs: nowMs + Math.max(1, Number(policy.windowSeconds) || 60) * 1000,
      };
    }

    if (bucket.used >= bucket.limit) {
      this.#buckets.set(key, bucket);
      return {
        ok: false,
        error: "rate_limit_exceeded",
        state: this.#view(bucket, nowMs),
      };
    }

    bucket.used++;
    this.#buckets.set(key, bucket);
    return { ok: true, state: this.#view(bucket, nowMs) };
  }

  peek(playerId, actionKey, nowMs = Date.now()) {
    const key = String(playerId || "").trim() + ":" + String(actionKey || "").trim();
    const bucket = this.#buckets.get(key);
    if (!bucket || nowMs >= bucket.windowEndsAtMs) {
      const policy = this.defaults[actionKey];
      if (!policy) return null;
      return {
        playerId,
        actionKey,
        limit: Number(policy.limit) || 1,
        used: 0,
        remaining: Number(policy.limit) || 1,
        windowEndsAt: new Date(nowMs + (Number(policy.windowSeconds) || 60) * 1000).toISOString(),
      };
    }
    return this.#view(bucket, nowMs);
  }

  #view(bucket) {
    return {
      playerId: bucket.playerId,
      actionKey: bucket.actionKey,
      limit: bucket.limit,
      used: bucket.used,
      remaining: Math.max(0, bucket.limit - bucket.used),
      windowEndsAt: new Date(bucket.windowEndsAtMs).toISOString(),
    };
  }
}
