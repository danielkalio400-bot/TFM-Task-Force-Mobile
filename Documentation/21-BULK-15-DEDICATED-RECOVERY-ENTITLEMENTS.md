# Bulk 15 - Dedicated allocation, entitlements, authoritative recovery and telemetry gates

This bulk strengthens the production boundary after content/map readiness.

## Added
- Per-player content entitlement state separate from downloaded content.
- Section entitlement checks over required content packs.
- Dedicated-session allocation gated by section lifecycle and regional live-operations state.
- Short-lived server assignment reuse through the existing authoritative allocation foundation.
- Session snapshot creation at allocation/connect time.
- Authoritative recovery envelopes bound to the latest non-terminal server/session snapshot.
- Single-use recovery consumption.
- Android/iOS/Windows production telemetry gates for frame time, latency, packet loss and thermal state.
- Shared contracts, persistence tables, API routes and tests.

## Blueprint alignment
The source guide requires server-authoritative multiplayer, region-aware allocation, reconnect tolerance, content/version gates, package/performance validation and mobile-device testing. This bulk connects those systems rather than treating them as isolated prototypes.

## Production boundary
Entitlements are local development records and not purchase verification. Dedicated allocation uses the local server registry and does not create cloud compute. Telemetry thresholds are development defaults and must be tuned through real Android, iOS, Windows and regional-server testing.
