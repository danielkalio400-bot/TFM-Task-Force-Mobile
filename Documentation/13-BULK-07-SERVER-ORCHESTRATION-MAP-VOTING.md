# Bulk 07 - Server orchestration, map voting and performance telemetry

This bulk follows the TFM blueprint's dedicated multiplayer and operations requirements.

## Added
- Dedicated-server heartbeat and health-state contracts.
- Region-aware ready-server selection.
- Short-lived per-match join assignments.
- Client assignment/heartbeat DTOs.
- Reconnect policy with bounded exponential delay.
- Network quality samples.
- Map-vote state and backend service.
- Spectator-state contract.
- Runtime performance/network telemetry aggregation.
- Shared schemas, persistence tables and automated tests.

## Blueprint alignment
The blueprint calls for matchmaking to select a region, assign or start an authoritative server, issue short-lived join credentials, record validated match outcomes, monitor sessions and dispose of them cleanly. It also separates rendering FPS from network/server latency and requires health telemetry plus fail-safe reconnect behavior.

## Production boundary
The current registry and assignment services are local in-memory prototypes. They do not start cloud servers, expose a real dedicated-server build, validate production BazID credentials, implement encrypted game transport or provide an anti-cheat product. Those remain deployment/integration milestones.
