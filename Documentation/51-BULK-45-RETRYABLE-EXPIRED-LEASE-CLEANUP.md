# TFM Bulk 45 — Retryable expired dedicated-server lease cleanup

Bulk 41 introduced a heartbeat lease, but `sweepExpired()` marked expired matches as processed even if cancellation failed due to a temporary session persistence outage or revoked server principal. Operators had no safe retry path, so a match could remain active in the saved control plane after its lease expired.

The monitor now separates the irreversible **expired** permission boundary from the **cleanup** state. An expired session can never call heartbeat, add score, or perform round operations again. The host can invoke `sweepExpired()` repeatedly; failed cleanups remain pending, while successful ones are marked closed and do not repeat. If a close updated the match round but the terminal checkpoint failed, a later sweep invokes the trusted bridge's `reconcileCheckpoint` and saves the missing terminal state **without issuing another objective event**. If server identity is revoked, cleanup stays pending until the existing verifier authorizes it again. A match reassigned to another server cannot be cancelled by an old lease.

Diagnostics now expose `pendingCleanup` and `completedCleanup` counts, without player rosters or credentials. Fault-injection regression tests cover store outage, authorization revocation, reassignment and repeat sweeps.

No automatic scheduler, durable outbox, multi-host consensus or production service certificate verification is claimed. This is a local/server-host reference implementation, not a compiled Unity dedicated server.
