import test from "node:test";
import assert from "node:assert/strict";
import { ActionRateLimitService } from "../src/services/action-rate-limits.mjs";
import { ModerationSanctionService } from "../src/services/moderation-sanctions.mjs";
import { ConsentSettingsService } from "../src/services/consent-settings.mjs";
import { NotificationPreferenceService } from "../src/services/notification-preferences.mjs";
import { SocialSafetyPolicyService } from "../src/services/social-safety-policy.mjs";
import { socialSafetyRuntime } from "../src/social-safety-contracts.mjs";

test("social safety contract includes rate limits, sanctions and consent", () => {
  assert.ok(socialSafetyRuntime.systems.includes("rate-limits"));
  assert.ok(socialSafetyRuntime.systems.includes("moderation-sanctions"));
  assert.ok(socialSafetyRuntime.systems.includes("consent-settings"));
  assert.match(socialSafetyRuntime.productionBoundary, /development defaults/i);
});

test("rate limiter blocks after configured action budget", () => {
  const service = new ActionRateLimitService({
    "friend-request": { limit: 2, windowSeconds: 60 },
  });
  assert.equal(service.consume("p1", "friend-request").ok, true);
  assert.equal(service.consume("p1", "friend-request").ok, true);
  assert.equal(service.consume("p1", "friend-request").error, "rate_limit_exceeded");
});

test("social sanction blocks social actions before rate limit is consumed", () => {
  const sanctions = new ModerationSanctionService();
  const consent = new ConsentSettingsService();
  const rateLimits = new ActionRateLimitService({
    "friend-request": { limit: 2, windowSeconds: 60 },
  });
  const policy = new SocialSafetyPolicyService({ sanctions, consent, rateLimits });

  sanctions.create({
    playerId: "p1",
    type: "social-restricted",
    reasonCode: "abuse-review",
    durationSeconds: 60,
  });
  assert.equal(policy.evaluate("p1", "friend-request").reason, "moderation_social_restriction");
  assert.equal(rateLimits.peek("p1", "friend-request").used, 0);
});

test("consent can disable social discovery", () => {
  const sanctions = new ModerationSanctionService();
  const consent = new ConsentSettingsService();
  const rateLimits = new ActionRateLimitService({
    "friend-request": { limit: 2, windowSeconds: 60 },
  });
  const policy = new SocialSafetyPolicyService({ sanctions, consent, rateLimits });

  consent.update("p1", { socialDiscovery: false });
  assert.equal(policy.evaluate("p1", "friend-request").reason, "social_discovery_disabled");
});

test("security and moderation notifications remain enabled", () => {
  const service = new NotificationPreferenceService();
  const updated = service.update("p1", {
    security: false,
    moderation: false,
    friend: false,
  });
  assert.equal(updated.settings.security, true);
  assert.equal(updated.settings.moderation, true);
  assert.equal(updated.settings.friend, false);
});
