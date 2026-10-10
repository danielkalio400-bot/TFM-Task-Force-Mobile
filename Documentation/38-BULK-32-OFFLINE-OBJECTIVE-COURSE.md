# TFM Bulk 32 — Ordered waypoint objective course

The preceding Training Yard demo and 75-second target trial remain separate and unchanged in purpose. This batch adds a non-combat objective time trial that can be tested on the same original 30m x 30m Unity yard.

## Implemented
- Five original geometric waypoint beacons created **at runtime** under the scene root.
- Strict ordered progression: entering the next beacon advances one waypoint per simulation update. Previously completed waypoints cannot score again.
- 90-second round with ready/active/completed/expired/cancelled state machine, application focus/pause handling and manual restart.
- Score 100 points per checkpoint, plus two points for each whole remaining second at completion; device-only local best.
- Safe-area-aware on-screen status and start/retry/cancel panel.
- Two local practice activities are mutually exclusive: starting the new waypoint route cancels the existing target trial; starting the target trial cancels the new route.
- Pure JavaScript reference rules with dynamic tests plus Unity source integration checks.
- Versioned manifest updated to install all new scripts in the actual Unity project.

## Boundaries and validation
This is an offline waypoint course, not multiplayer scoring or a dedicated match. It does not emit XP, inventory transactions, real-time authoritative match results, or online leaderboards.
Run `cd Backend && npm test`. Then import into Unity 6 URP and press Play in the original yard. Manually validate marker location, unobstructed access, mobile landscape safe areas, and round coordination. No Unity Editor/device builds or performance profiles have been executed by Node CI.
