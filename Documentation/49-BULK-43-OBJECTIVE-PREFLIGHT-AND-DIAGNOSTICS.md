# TFM Bulk 43 — Pre-mutation checkpoint fencing and read-only consistency reporting

## Engineering gap closed
Bulk 42 added compare-and-set checkpoint writes, but the adapter could still mutate the live scoreboard *before* discovering its previously saved session sequence had become stale. Bulk 43 adds a synchronous **preflight** before every mutating dedicated round operation: the session sequence must match the previous checkpoint committed by this bridge, and its round ID and revision must still match the active authoritative round. Mismatches fail closed before the operation. A newly constructed bridge cannot silently take over an existing round without an explicit authenticated handoff protocol.

`inspectObjectiveSessionIntegrity()` is a read-only operator diagnostic for comparing the current server-owned round with the in-memory checkpoint. It reports authority, phase, terminal and revision consistency without exposing rosters, player IDs, access tokens, or progression permissions.

Regression tests verify that stale checkpoint writes cannot change scores or revisions, that a secondary bridge cannot claim another bridge's round, and that diagnostics distinguish consistent/phase/authority conflicts.

## Still outstanding
The scoreboard and session checkpoint are not one durable transactional database. Real multi-process recovery requires a trusted handoff, database transaction/locking, dedicated server binary and service identity validation. This bulk does not provide full multiplayer game functionality, Unity compilation or mobile/Windows device verification.
