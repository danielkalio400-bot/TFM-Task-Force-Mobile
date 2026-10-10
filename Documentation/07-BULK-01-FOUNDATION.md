# Bulk 01 - Cross-platform foundation

This bulk establishes reusable foundations without fabricating Unity-generated project files.

## Added
- Android/iOS/Windows platform capability detection.
- Runtime quality recommendation and frame-rate policy.
- Shared event bus and service registry.
- Input snapshot/device contracts.
- Player session state.
- Inventory and loadout data foundations.
- Match phase state machine.
- Local profile persistence for offline development only.
- Shared platform and player-profile contracts.
- Reference progression/loadout database migration.
- Backend platform/status endpoints.
- Backend CI and expanded smoke tests.

## Not implemented yet
- Production BazID authentication.
- Real multiplayer transport or authoritative dedicated servers.
- Production weapons, damage replication, lag compensation or matchmaking.
- Final UI, art, animation, audio, maps or content.
- Platform store signing/release configuration.

## Repository rule
No backup copies, generated Unity caches, build output, ZIP snapshots or local databases belong in Git. Git history is the source backup.
