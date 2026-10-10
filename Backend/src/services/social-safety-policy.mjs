export class SocialSafetyPolicyService {
  constructor({ sanctions, consent, rateLimits }) {
    this.sanctions = sanctions;
    this.consent = consent;
    this.rateLimits = rateLimits;
  }

  evaluate(playerId, actionKey) {
    playerId = String(playerId || "").trim();
    if (!playerId) return { allowed: false, reason: "invalid_player_id" };

    if (this.sanctions.blocksSocial(playerId))
      return { allowed: false, reason: "moderation_social_restriction" };

    const consent = this.consent.get(playerId);
    if (actionKey === "friend-request" && consent?.socialDiscovery === false)
      return { allowed: false, reason: "social_discovery_disabled" };

    const rate = this.rateLimits.consume(playerId, actionKey);
    if (!rate.ok)
      return { allowed: false, reason: rate.error, rateLimit: rate.state || null };

    return { allowed: true, rateLimit: rate.state };
  }
}
