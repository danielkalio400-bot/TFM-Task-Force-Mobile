# Bulk 19 - Progression authority, audit history and leaderboards

This bulk closes an important gap in the TFM live-service ownership model.

## Added
- Trusted-source progression grant service.
- Idempotent grant receipts keyed by source/player.
- Progression audit history.
- Level-based unlock state.
- Progression leaderboard snapshots.
- Client receipt/unlock/leaderboard DTOs.
- Shared runtime contract.
- Persistence tables, routes and automated tests.

## Blueprint alignment
The TFM blueprint says progression must use server-validated XP, levels and unlocks with audit history. This bulk turns that rule into an explicit service boundary instead of allowing progression to be treated as client-authored state.

## Authority boundary
Only trusted server-side source types are accepted by the authority service. The existing direct profile mutation endpoint remains a development prototype and is not a production trust boundary. Production still needs authenticated server identities, durable transactions, replay protection across processes and database-backed leaderboards.
