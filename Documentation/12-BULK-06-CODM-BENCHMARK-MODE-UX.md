# Bulk 06 - Competitive mode and UX foundations

This bulk uses current Call of Duty: Mobile only as a high-level product benchmark for mobile session structure, mode discoverability, private-match flexibility, rank presentation, touch/controller accessibility and performance expectations.

## Originality boundary
TFM must not copy Call of Duty: Mobile map layouts, proprietary art, branded UI, operator designs, sound, weapon blueprints, progression copy or protected level-specific design. TFM remains an original standalone game.

## Added
- Data-driven mode/category descriptors.
- Private-match rule model and backend prototype.
- Map-rotation metadata.
- Team ping/event model.
- Ranked state and rating foundation.
- Accessibility and color-vision settings.
- Touch/control-preset state.
- Device performance budgets.
- Backend private-match/ranked services and tests.
- Shared JSON schemas for private matches, ranked seasons and performance profiles.

## Benchmark observations
Current COD Mobile public material emphasizes Multiplayer, Battle Royale and DMZ-style extraction experiences, with strong mobile loadout/control customization, ranked competition and changing seasonal content. TFM should match the usability standard while keeping its own modes, maps, names, visual language and rules.

## Production boundary
Ranked rating is currently a local prototype, not production matchmaking. Private matches are local in-memory state. No real tournament integrity, anti-cheat adjudication, server-authoritative scoring, live moderation or dedicated-server lifecycle is implied yet.
