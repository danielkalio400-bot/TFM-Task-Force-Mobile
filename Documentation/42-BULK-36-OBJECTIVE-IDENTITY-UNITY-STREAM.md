# TFM Bulk 36 — Authenticated objective-session integration boundary and Unity SSE client

## Added
- `ObjectiveIdentityGate` accepts **only injected external cryptographic verifier results** and keeps verified principal instances in a private WeakSet; callers cannot claim `verified:true` themselves.
- Explicit issuer, audience, subject equality and expiration checks. Default verifier denies all tokens; the repository does not impersonate BazID/JWKS.
- `ObjectiveSessionIssuer` invokes the already delivered trusted assignment + roster checks and issues 256-bit viewer/reconnect capabilities only after identity validation.
- HTTP issuance route accepts bearer authorization in header, rejects client-supplied principal/verified/signatureValidated fields and returns cache-control no-store. Default application still rejects issuance until real BazID verification is integrated.
- Unity `TFMObjectiveLiveStreamClient` streams SSE with `UnityWebRequest` / `DownloadHandlerScript`, incremental UTF8 decoding, existing SSE framing parser, existing revision/event cursor and snapshot callbacks.
- Client accepts HTTPS, or HTTP only for loopback development, never places tokens in query strings, and clears tokens on disconnect. Integration and source tests cover required safety boundaries.

## Not done
No production BazID issuer/JWKS configuration, no production-grade auth deployment, no matchmaking enrollment source, no Unity authoritative physics, no completed multiplayer client UI, no device tests. This client can connect to a properly provisioned local SSE stream **only when a trusted external validator and live server match are configured**; stock makeServer deliberately denies viewer issuance. Node CI does not compile Unity C#.

## Next
Verify Build Settings on Android/iOS/Windows in Unity 6 URP, implement the actual secure BazID adapter/service-to-service trust and a real dedicated game server before enabling user-accessible login or live matches.
