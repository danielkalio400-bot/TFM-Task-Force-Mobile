# Bulk 04 - Progression, objectives and recovery foundation

## Added
- Client progression rules/state/reward grants.
- Objective definition/tracking foundation.
- Reusable team-score mode rule set.
- UI navigation state.
- Multiplayer transport and server-allocation interfaces.
- Lobby readiness DTO.
- Session-recovery DTO.
- Shared progression and recovery schemas.
- In-memory progression service and API.
- Single-use local session-recovery prototype.
- Lobby ready-state endpoint and tests.
- Reference progression-event and recovery database tables.

## Production boundary
The APIs remain local development prototypes. Reward grants are not authenticated, soft credits are not purchasable currency, and reconnect records are not secure session tokens. Production progression must be server-authoritative, signed/validated through authenticated game sessions and protected against replay/duplication. Real network transport and dedicated-server allocation remain separate future work.
