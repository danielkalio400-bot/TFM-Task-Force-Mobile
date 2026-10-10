# TFM Bulk 41 — Dedicated server heartbeat leases and bounded objective authority

This bulk adds an **in-process** `ObjectiveServerLeaseMonitor` wrapping the previously verified `ObjectiveDedicatedSessionBridge`. A server principal must be authenticated through the existing injected trust boundary and must already own an active persisted match. The resulting match-scoped capability requires heartbeats before the lease deadline. Each operation rechecks server authorization, so revoked identities cannot keep using a valid lease.

The host explicitly calls `sweepExpired()` to cancel a timed-out objective round via the existing trusted server session; cancellation flows through the same terminal session-persistence path. The monitor does not automatically schedule work or pretend to implement distributed consensus. Expired capabilities cannot be renewed or reused. If the game-server principal has already been revoked, the sweep cannot force a trusted cancellation; this must be handled by a separate deployment orchestrator.

`ServerObjectiveRoundsService` now has bounded match instances, bounded per-round idempotency records and bounded retained event pages. It rejects excess new scoring events rather than throwing away request IDs (which would allow replay). Its diagnostics reveal only aggregate counts. Terminal rounds remain in process to prevent reuse of old match IDs while tokens may remain outstanding.

Node tests cover clock-controlled lease expiration, heartbeat renewal, trusted cancellation, server principal revocation, resource capacity, score idempotency and REST write denial.

## Still missing
Unity dedicated-server binaries, game physics validation, BazID or hosting-issued service certificates, a durable distributed session store, fault-tolerant control-plane scheduling, production matchmaking, mobile/PC game builds and runtime soak tests. This code is local/server-host integration scaffolding, **not** a launched multiplayer deployment.
