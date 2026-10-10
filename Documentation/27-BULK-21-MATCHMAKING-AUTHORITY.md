# Bulk 21 - Time-bounded fair matchmaking authority

This bulk implements the remaining matchmaking ownership rule from the TFM blueprint.

## Added
- Time-bounded matchmaking search tickets.
- Oldest-first candidate ordering.
- Gradual skill-window expansion.
- Shared-region placement requirement.
- Cross-platform opt-out handling.
- Party-integrity preservation.
- Queue expiration and cancellation.
- Match-assignment audit data.
- Client ticket/assignment/policy DTOs.
- Shared runtime contract, persistence tables, routes and tests.

## Blueprint alignment
The blueprint requires matchmaking to use time-bounded queues, fair matching and region-aware placement. This bulk turns those requirements into an explicit local policy service.

## Production boundary
This remains an in-memory deterministic policy prototype. Production still requires authenticated party ownership, distributed queue storage, measured network latency, server-capacity integration, anti-abuse/rate limits, real skill models, backfill policy, reconnect handling and durable assignment audit.
