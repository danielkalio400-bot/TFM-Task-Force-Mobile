# Bulk 20 - Authoritative match records and replayable telemetry

This bulk implements the TFM blueprint rule that match results are validated authoritative records with replayable telemetry.

## Added
- Authoritative match-record DTO.
- Externally validated proof-reference requirement.
- Trusted game-server allowlist in the development archive.
- Immutable-by-match archive behavior.
- Sequenced replay-telemetry events.
- Replay sealing and manifests.
- Progression handoff through the trusted progression-authority service.
- Shared runtime contract.
- Persistence tables, routes and automated tests.

## Blueprint alignment
The guide states that match results should be signed/validated authoritative game records with replayable telemetry. This bulk creates that service boundary while keeping real cryptographic signing outside the starter.

## Security boundary
The starter accepts only a proof identifier explicitly marked as already validated and a trusted server identity. It does not contain production signing secrets, verification keys, key-rotation infrastructure or real anti-cheat cryptography.

## Production boundary
The archive is in-memory development state. Replay events are metadata only, not a complete deterministic simulation replay. Production requires durable storage, real server authentication, cryptographic verification and retention/privacy policy.
