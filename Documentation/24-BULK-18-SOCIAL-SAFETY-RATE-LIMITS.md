# Bulk 18 - Social safety, consent and anti-abuse gates

This bulk extends the TFM live-service layer with the safety controls explicitly required by the blueprint.

## Added
- Configurable per-player social-action rate limits.
- Moderation sanctions for warnings, communication/social restrictions and account suspension state.
- Consent settings for social discovery, communication and cross-service integration.
- Notification preferences.
- Security/moderation notification categories that cannot be suppressed by ordinary preference changes.
- Social-safety policy evaluation before rate-limited actions.
- Shared contract, backend routes, persistence tables and tests.

## Blueprint alignment
The blueprint requires age-appropriate privacy, audit trails, account recovery, rate limits, anti-abuse review and consent-aware integrations. It also requires friends/clans to use moderation-aware visibility, privacy controls and consent.

## Production boundary
These are local development controls. Production needs authenticated identities on every mutation, durable distributed rate limiting, moderator authorization, appeals, abuse analytics, jurisdiction/age review and auditable policy configuration.
