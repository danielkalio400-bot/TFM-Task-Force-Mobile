# TFM Bulk 40 — Bounded SSE streaming, resume cursor and stale-callback isolation

## Changes
- The live read-only objective-event endpoint honors a valid SSE `Last-Event-ID` header when no explicit `afterSequence` query cursor is present. It rejects malformed, negative, non-integer, unsafe, duplicated and contradictory cursors before consuming a viewer capability.
- The server now closes a stream if `res.write` indicates backpressure, so slow clients cannot build unbounded output buffers. Viewer handles release exactly once on response closure, terminal completion or transport failure.
- HTTP request `close` no longer prematurely invalidates an ongoing SSE response; response closure is the stream lifetime boundary.
- The Unity `TFMObjectiveLiveStreamClient` now captures a connection generation for each streaming download handler. Worker-thread callbacks arriving after disconnect/reconnect are ignored before they can interfere with the new stream's snapshot and cursor.

## Tests
Node tests simulate SSE clients, backpressure, disconnect, Last-Event-ID handling and source threading guards. The existing game server's roster, match assignment, player identity and progression trust boundaries remain unchanged.

This is still a *development* stream, not a production multiplayer transport: BazID verifier, Unity game-server build, authoritative collision/world simulation, deployment TLS, device testing and durable multi-node event replay are not implemented.
