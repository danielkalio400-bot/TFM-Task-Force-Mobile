# Bulk 05 - Identity and live-service boundaries

This bulk follows the TFM blueprint's separation between BazID identity and TFM-owned gameplay state.

## Added
- Client authentication/session state contracts.
- OIDC authorization-request data model with PKCE fields only; no secrets.
- Short-lived game-session credential model.
- Server-authoritative inventory transaction model.
- Authoritative match-result record model.
- Player reporting/moderation models.
- Friend/clan data boundaries.
- Telemetry event/sink interfaces.
- Local development game-session service with opaque expiring tokens.
- Local inventory ledger with non-negative balance enforcement.
- Trusted-local-server match-result acceptance prototype.
- Moderation report intake.
- Shared JSON schemas and database reference tables.
- Automated service tests.

## Security boundary
The local development endpoint accepts a value named validatedSubject only to exercise the TFM side of profile/session linking. It is not BazID validation and must not be exposed publicly.

Production must use system-browser OIDC authorization code + PKCE, validate signature/issuer/audience/expiry server-side, and issue narrow short-lived game credentials. Unity builds must not contain BazID passwords, signing keys or privileged long-lived tokens.

Persistent progression and inventory must be changed only from validated authoritative service/game-server events, not from untrusted client claims.
