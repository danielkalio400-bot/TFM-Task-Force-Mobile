# TFM Bulk 46 — Expired allocation cleanup before objective round opens

A dedicated server may obtain an assigned match and register its heartbeat lease, yet never open the actual objective round (e.g., game host fails during map load). Earlier lease cleanup called `closeRound`, which returned `objective_round_not_found`. The assignment stayed active in session persistence and every subsequent sweep repeated the same error.

When this exact condition occurs, the in-process monitor now creates **only a terminal session checkpoint** — no objective round, capture, score, winner, player grant or fabricated event. It first revalidates the registered server identity, checks the original server still owns the match, and invokes the existing `saveIfCurrent` API with matching session sequence and map fencing. Temporary database failure is left pending for retry. A match reassigned to another server cannot be cancelled by the old expired lease. A successful cleanup is terminal and not repeated.

The regression suite covers unopened match expiration, terminal session sequence, transient write outage/retry, trust revocation, and reassignment. It does not implement distributed scheduling, matchmaking, true crash recovery or live gameplay physics. Unity builds and device testing are still required.
