# TFM Bulk 38 — Dedicated match objective synchronization and recovery checks

## Delivered
A dedicated-server **in-process** session bridge establishes a different trust boundary from client-side player join credentials. The host injects a verified server principal check; the default rejects all callers. A trusted match session's operations `openMatch / beginRound / captureObjective / closeRound / advanceClock` use the existing server-owned objective round state and the existing `SessionPersistenceService`. The match's server ID, map ID and persisted lifecycle are checked before every operation.

Objective captures require a second injected validator for **dedicated-server-owned collision proof**; it also defaults to reject. Client-supplied score claims or arbitrary `proof:true` fields do not confer authority. Only real server physics can satisfy this in production; the CI fixture uses an explicit mock validator, not a field that the public REST API trusts.

Match session snapshots track phases, monotonic revision, terminal state, and a replay-safe authoritative event sequence. Gap detection triggers a complete snapshot resync. A Unity read-only synchronization DTO enables later transport wiring. Tests cover revoked server principals, map and server mismatches, terminal phase, replayed requests, event retention and public REST write denial.

## Not implemented / safety of claims
The stock backend does **not** have a production dedicated-server identity verifier, game physics or a Unity dedicated-server process; all mutating bridge APIs remain private to code and default-deny. It is not a matchmaking server, not full realtime multiplayer, not an XP service, and not a production network layer. The current `SessionPersistenceService` is in-memory, not durable database state. CI Node tests and static Unity C# checks do not establish mobile/PC game builds.

Run `cd Backend && npm test`, then check Actions for the committed SHA.
