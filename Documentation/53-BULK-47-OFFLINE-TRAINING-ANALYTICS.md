# TFM Bulk 47 — Offline shooting drill analytics and completion medals

The original Unity training yard now records hit and miss totals, the current streak of hits on **uncleared** training dummies, and the longest such streak in each attempt. A miss or a shot against an already-cleared target breaks the streak; repeated dummy respawns cannot increase the number of cleared targets. Starting another attempt clears all counters.

The safe-area training HUD shows the drill's hit statistics while playing and a **local practice-only** Gold/Silver/Bronze medal when the full drill is completed. Gold requires at least 90% accuracy and a longest valid-hit streak at least equal to the total target count; Silver requires 70% accuracy; other completions earn Bronze. Cancelling or timing out awards no medal. This does **not** change the existing offline scoring formula, stored local best score, matchmaking rank, XP, or online inventory.

A deterministic Node test reference checks successful, missed, duplicate, cancelled, expired and retried attempts. Unity source wiring is statically verified but no Editor/Android/iOS/Windows runtime build was executed. These medals are in no way authoritative competitive scoring.
