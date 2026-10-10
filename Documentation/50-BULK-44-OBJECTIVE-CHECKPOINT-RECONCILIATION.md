# TFM Bulk 44 — Idempotent dedicated objective checkpoint reconciliation

Objective score changes can complete successfully in the in-process match authority and fail to persist in `SessionPersistenceService` (for example, temporary storage unavailability). Bulks 42–43 prevented stale writes and other mutations, but offered no explicit method to repair a stranded match **without re-awarding scores**.

Bulk 44 records one in-memory pending session checkpoint when an authoritative round revision advances. If the fenced checkpoint write fails, all subsequent scoring, lifecycle and read-sync operations for that bridge are blocked until the verified dedicated-server session calls `reconcileCheckpoint(matchId)`. Reconciliation checks the match/round ID, revision, map ID, and original expected session sequence, then retries only the checkpoint write. It **never** replays the gameplay capture or adds points again. Successful retry clears the pending record and advances the tracked session sequence.

Clock-driven expiration is also persisted when a late capture is rejected, preventing an expired round from remaining active in session storage. Automated fault-injection tests cover initial open failure, scoring write outage, terminal checkpoint recovery, reassignment, identity revocation and deadline expiration.

This is **not** distributed transaction processing: a process crash loses the pending ledger and authoritative scoreboard, and a persistent DB-backed outbox plus trusted failover will still be required. No claims of production game-server uptime, anti-cheat physics or Unity Android/iOS/Windows binaries are made.
