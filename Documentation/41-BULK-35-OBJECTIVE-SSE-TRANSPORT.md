# TFM Bulk 35 — Read-only SSE objective live transport

A working Node HTTP Server-Sent Events transport **for controlled local test environments**. Existing objective gameplay authority and progression/anti-cheat boundaries remain unchanged.

## Implemented
- An in-process viewer capability issuer that first calls `ObjectiveReconnectBridge.connect()` and thus requires an independently injected subject verifier, current server assignment, join credential and player roster membership.
- Separate 256-bit random live-view capability, SHA-256-only storage, 60-second expiry, match-bound use and at most one active connection per token.
- Real Node SSE GET endpoint (`/v1/dev/objective-live/:matchId/events`) with Bearer Authorization **header**, never URL query. No public HTTP endpoint can issue a viewer capability or submit a score.
- On connect emits `snapshot`; later emits `delta`, `resync`, `access-ended` and keepalive as needed. Handles a truncated event history via authoritative snapshot, closes terminal streams, limits outstanding sessions, cleans disconnects.
- Tests include actual Node network listen/fetch, denial without a bearer, token/assignment checks, event streaming, cursor handling and timeout.
- Unity-side SSE framing parser for a future streaming client; source manifest updated.

## Remaining work
BazID production authorization, Unity dedicated servers and capture physics, real authenticated token issuance by game session service, authenticated cloud deployment, persistent event bus, metrics, rate limiting and production mobile streaming client are NOT implemented. The `makeServer` default is **fail closed**: its bridge authorizer denies all viewer issuance, so a real authenticated game-client connection cannot be established without integration. The test harness injects explicit mock subject authentication.

Run `cd Backend && npm test` for Node tests. Unity compilation and Android/iOS/Windows device testing have not been performed.
