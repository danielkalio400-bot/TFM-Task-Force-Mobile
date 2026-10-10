# TFM Bulk 39 — Objective ownership integrity and checkpoint idempotency

## Gameplay authority bug closed
The dedicated objective round previously accepted unlimited new request IDs for the **same team controlling the same objective**, permitting repeated points without a control change. Objectives now have a server-owned control team. Each capture is accepted only when unclaimed or when the opposing team retakes it. Repeated events from the same controlling team fail without changing score, sequence or event history. Existing request-ID idempotency/conflict checks remain intact.

Snapshots carry both a map of controlled objectives and a Unity JsonUtility-compatible flat `controlledObjectives` array. The underlying authenticated-server and physics-verifier boundaries from Bulks 36–38 remain unchanged.

## Session reliability
The dedicated session bridge now avoids creating a new session checkpoint on no-op server clock ticks (not just exact duplicate requests). Terminal transitions still advance the round revision and persist a terminal session.

## Verification and caveats
Node regression tests cover same-team farming, opponent recapture, conflict, read-only REST boundary, repeated no-op ticks and Unity source mappings. This is not a deployed dedicated game server and does not replace server-owned physics validation or real BazID trust. Android/iOS/Windows and Unity Editor compilation remain unverified. A gameplay design review is still required to determine final points-per-capture balance.
