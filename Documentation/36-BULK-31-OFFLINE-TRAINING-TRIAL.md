# Bulk 31 — Repeatable Local Training Trial

The prior batches established an editor-generated original Unity 6 yard with 3 dummy targets, third-person input, a working local firearm simulation and adaptive presentation. This bulk integrates a **playable round objective**, without claiming a multiplayer match.

## What is implemented
- Manually started 75-second practice round with clear states (ready, running, completed, expired, cancelled).
- Target-clear objective: each of the three original geometric practice targets must be cleared at least once.
- Weapon shot event exposes local accepted hits, cleared targets and remaining ammo to the drill component.
- Round reset restores targets and demo ammo, cancels outstanding respawn/flash coroutines and clears counters.
- Timer respects app focus and pause to avoid background time penalties.
- Score from cleared targets, accuracy and time remaining; optional **local device only** personal best.
- Responsive debug HUD for touch and PC with retry/cancel and status.
- Existing saved Unity Training Yard is extended in `Awake()` at runtime; scenes and user materials are **not regenerated**.
- Node tests for contract and static integration references.

## Verify
Run `cd Backend && npm test`. Then import maintained source scripts in the real Unity 6 URP project. Use **TFM > Open Training Yard**, press Play, tap **Start / retry**, and clear each of 3 targets. Validate completed/expired/cancelled states, double resets, focus changes, short and tall mobile screens, Android and iOS touch and Windows keyboard/controller interaction. Use Unity Profiler for FPS and memory.

## Not yet delivered
Node CI source checks are not Unity compilation, animation QA, physical device verification, BazID identity, server-hosted multiplayer, anti-cheat, dedicated match simulation, original AAA assets, or release-ready app binaries. Local practice scores cannot write authoritative player XP, rank, inventories, leaderboards or match-result archives.
