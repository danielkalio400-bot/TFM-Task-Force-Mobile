# TFM Bulk 37 — Reconnect rotation and Unity SSE thread safety

This bulk builds on Bulk 36's verifier-injected identity boundary. No fake JWT/JWKS or bypass flag is introduced.

## Delivered
- An additional POST `/v1/dev/objective-session/reconnect` route validates a fresh bearer through the existing ObjectiveIdentityGate and uses a single-use reconnect token to renew the live stream viewer capability.
- The old reconnect capability is consumed **after** validation succeeds; a newly minted reconnect capability supports subsequent interruptions. Reconnect explicitly refuses client-supplied assignment/match/server fields.
- Same strict match/player/session-roster checks and server-owned objective state remain in force. No public score mutation or XP awards.
- `TFMObjectiveLiveStreamClient` buffers downloaded SSE frames behind a lock so worker-thread HTTP callbacks never call Unity `JsonUtility`, `UnityWebRequest.Abort` or game events. The main-thread Update dispatch applies a 256-frame cap and aborts on overflow.
- Node integration tests verify rotation/replay/identity/cursor and HTTP rejection, plus static Unity threading assertions.

## Not delivered
Production BazID cryptographic verification (injected verifier still denies by default), deployed multiplayer servers, reliable cross-restart token persistence, reconnect UX in real mobile gameplay, Unity Editor compilation and device QA. These must be implemented and verified before multiplayer can be declared playable.
