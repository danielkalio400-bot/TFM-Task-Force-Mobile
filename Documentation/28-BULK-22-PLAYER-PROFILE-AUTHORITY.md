# Bulk 22 - Player profile authority and identity-reference lifecycle

This bulk implements the player-profile ownership rule in the TFM blueprint.

## Added
- Stable TFM player identifier.
- External BazID subject-reference link.
- Display-profile state.
- Profile lifecycle state.
- Profile audit history.
- Deletion-request-compatible lifecycle state.
- Client DTOs.
- Shared runtime contract.
- Persistence tables, routes and tests.

## Blueprint alignment
The blueprint states that TFM player profiles store a stable game identifier plus BazID subject reference and never credentials. This bulk makes that storage boundary explicit.

## Security boundary
Player profile records do not contain passwords, signing credentials or privileged identity-provider tokens. The subject reference is still sensitive account-linking metadata and must be protected in production.

## Production boundary
The implementation is an in-memory authority prototype. Production requires authenticated service calls, encrypted durable persistence, privacy/retention enforcement, operational audit controls and integration with the real BazID OIDC validation path.
