# TFM Bulk 42 — Match checkpoint fencing and stale-session protection

## Implemented
`SessionPersistenceService.saveIfCurrent` provides a synchronous, **in-process** compare-and-set snapshot write. Callers supply the session sequence, server identity and map they observed. Any stale sequence, server/map reassignment, terminal session, or forbidden phase regression is rejected without changing the current checkpoint.

`ObjectiveDedicatedSessionBridge` now requires this fenced API when persisting trusted round transitions; missing support fails closed. The existing lease monitor and session APIs continue to enforce verified server ownership and fail-closed capture validation. No REST endpoint exposes scoring, allocation or checkpoint writes.

Node tests exercise stale replay, phase regression, terminal fencing, reassigned server, the bridge call path and read-only contract availability.

## Important limitation
This prevents overwriting a newer **in-memory** session snapshot. The objective scoreboard update and the session checkpoint are **not an atomic durable database transaction**, and a failed persistence write may still require operator reconciliation. Production still needs a real transactional storage adapter, signed server identity, authoritative world physics, server binaries and device QA. No match recovery across process crashes is claimed.
