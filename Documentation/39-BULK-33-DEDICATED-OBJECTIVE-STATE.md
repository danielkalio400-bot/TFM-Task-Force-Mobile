# TFM Bulk 33 — Dedicated objective round state boundary

Source: TFM Full Development Blueprint and the established server-owned match/archive architecture.

A **new isolated objective-round server-side state machine** is implemented, not a fake multiplayer server or a replacement for the existing local Unity waypoint course.

## Delivered
- Dedicated-server in-process adapter with permission creation from a preconfigured trusted-server list.
- Configured objective identifiers and two separate teams; player IDs are unique and round membership verified.
- Warmup, active, completed, expired and cancelled match states.
- Server clock owns start, timeout, team score cap and winner.
- No public HTTP mutation routes. Read-only development snapshot and sequenced event-page routes; POST score claims receive HTTP 403.
- Deduplicated event request IDs, conflict checks, monotonically numbered events and copied snapshots.
- Stateful Node integration tests and a proposed SQL durable schema.
- Unity serializable snapshot DTO and stale-revision rejection buffer for **future** authenticated networking.

## Production requirements still outstanding
No socket transport, dedicated Unity server build, physics verification of objective capture, real server authentication, BazID session ownership, multiplayer replication, validated replay proof, database persistence, or progression connection is implemented. This code intentionally does not invoke the existing authoritative result pipeline. Node CI cannot compile Unity or validate Android/iOS/Windows builds.

No ZIPs, duplicate source copies, generated Library folders or backup snapshots.
