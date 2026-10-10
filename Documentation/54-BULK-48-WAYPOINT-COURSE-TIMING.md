# TFM Bulk 48 — Walkable waypoint guidance and local fastest course timing

The Unity Training Yard's **offline waypoint course** now displays the direction and planar direct distance to the next authored waypoint (N/S/E/W or HERE). Valid ordered waypoint arrivals record the elapsed time for the latest course leg. Completing the entire route stores a separate **fastest local course time** in PlayerPrefs, while retaining the existing score-based local best and original score formula. Cancelling, expiring or restarting never overwrites the fastest completion.

The mobile-aware HUD now shows the next waypoint, direct-distance guidance, latest leg time and the fastest recorded complete course time. The route remains physically walked using the existing player controller, and only the current marker is visible.

Node reference tests cover direction geometry, ordered arrivals, split times, partial/abandoned attempts and personal-best behavior; Unity source checks cover runtime wiring. This is not a realistic road network, online leaderboard or authoritative match reward. No Unity Editor/device runtime build is certified.
