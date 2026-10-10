# Bulk 02 - Combat and online foundation

Bulk 02 adds reusable gameplay contracts and a local matchmaking prototype while keeping real online networking explicitly unfinished.

## Client foundations
- Generic health and damage data.
- Team membership and team definitions.
- Reusable spawn point registry.
- Weapon definition/runtime-state data model for game balancing.
- Network roles, entity IDs and player transform snapshots.
- Bounded snapshot interpolation buffer.
- Runtime network-session state.
- Matchmaking ticket and match descriptor DTOs.

## Shared contracts
- Matchmaking ticket JSON Schema.
- Match descriptor JSON Schema.

## Backend
- Dependency-free bounded JSON request reader.
- In-memory matchmaking service.
- Ticket create/read/cancel operations.
- Local two-player queue pairing for compatible tickets.
- Match descriptor read endpoint.
- Matchmaking statistics endpoint.
- Expanded automated tests.

## Security and production boundaries
The backend remains local-only. Player IDs in the prototype request body are not trusted identity. Production matchmaking must derive player identity from a validated BazID-backed game session, use persistent/replicated queue infrastructure and connect only to authenticated authoritative game servers.

No production real-time transport, anti-cheat, ranking, dedicated server allocation, party service or reconnect system is claimed in this bulk.
