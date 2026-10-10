# Bulk 34 — Objective session/reconnect integration boundary

Integrates the prior server-owned objective round state machine with pre-existing server assignments and match session persistence through an **in-process-only** development bridge.

## Delivered
- A trusted-server-only `roster()` method on the existing objective-round adapter; no roster export via public REST.
- Explicit injected `authorizeSubject(principal, playerId)` check, default **deny**. Every initial join and reconnect requires a match roster member and matching validated subject.
- Initial join verifies assignment ID and ephemeral join credential using the existing `ServerAssignmentService`, matching server ownership, and a non-terminal persisted session.
- Each joined player receives a cryptographically random 256-bit reconnect capability; only its SHA-256 digest is retained, scoped to match/player/server, time limited and single-use.
- Monotonic event page catch-up and a full-snapshot resync requirement when replay retention has been truncated.
- In-process trusted session synchronization using `SessionPersistenceService.save`; terminal rounds block rejoining.
- Unity DTO/event cursor scaffolding for future client transport, versioned contracts, and automated failure/replay/gap tests.

## Remaining production boundaries
This feature does not expose a REST join endpoint, implement multiplayer socket transport, run a Unity dedicated server, provide BazID authentication, connect persistence to a database, or award match XP. The production operator must provide a real subject-authorizing callback and a secured game-service channel. The current bridge is usable in Node integration tests but **not yet connected to a Unity multiplayer session**.

Run `cd Backend && npm test` and inspect the GitHub workflow status. No backup folders, ZIP files, duplicate code or Unity Library/Temp generated content is committed.
