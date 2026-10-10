# Bulk 08 - Session operations and fair-play boundaries

This bulk follows the TFM blueprint's operations guidance: region-aware session flow, server health/draining, incident visibility, reconnect tolerance and fair-play review.

## Added
- Regional queue entry/state contracts.
- Ordered match-flow state machine.
- Server-drain modes and state.
- Spectator policy.
- Reconnect-ticket contract.
- Operational incident models.
- High-level fair-play review signals.
- Backend regional queue service.
- Backend match-session lifecycle service.
- Server-draining service.
- Incident logging service.
- Fair-play signal intake.
- API routes, tests and reference persistence tables.

## Safety and integrity boundary
Fair-play signals are defensive integrity metadata only. They do not expose exploit instructions, bypass techniques or offensive tooling. Signals should trigger review and corroboration, not automatic punishment from a single heuristic.

## Production boundary
The queue/session services are in-memory prototypes. Real production requires authenticated identity, persistent distributed queues, authoritative dedicated servers, regional capacity management, encrypted transport, observability and deployment automation.
