# Bulk 09 - Party, mode rules, rewards and reconnect restoration

This bulk strengthens the player-facing match loop while preserving the blueprint's server-authoritative boundaries.

## Added
- Generic mode-rule definitions for team score, individual score, zone control, round objectives, survival, extraction and cooperative defense.
- Party member/state models with mixed-platform composition.
- Party readiness and average-skill composition.
- Deterministic match reward policy.
- Idempotent backend reward grants per match/player.
- Reconnect restore state and single-use backend restoration records.
- Operations health snapshots backed by server health and incident state.
- Shared schemas, persistence tables and automated tests.

## Blueprint alignment
The TFM blueprint defines multiple permanent game categories, ranked competition, party/friend navigation, matchmaking state, server-owned progression/inventory and fail-safe reconnect behavior. This bulk connects those concerns without copying any protected map, UI, art, audio or proprietary content from another game.

## Production boundary
Parties, rewards and reconnect restoration remain local development services. Production requires authenticated player identity, durable distributed storage, authoritative match validation, anti-replay protections and deployment observability.
