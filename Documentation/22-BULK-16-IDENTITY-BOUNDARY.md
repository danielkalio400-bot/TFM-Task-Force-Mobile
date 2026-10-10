# Bulk 16 - BazID identity boundary and game-session lifecycle

This bulk implements the TFM blueprint's identity architecture without pretending the starter backend is a production identity provider.

## Added
- Client identity/session state.
- Authorization-code + PKCE request metadata.
- Validated-claims envelope.
- External identity boundary contract.
- Stable subject -> TFM profile linking through the existing game-session service.
- Short-lived TFM session issuance.
- Session revocation.
- Identity audit events.
- Data-deletion request lifecycle.
- Persistence tables and automated tests.

## Blueprint alignment
The guide requires BazID to remain an external identity provider; TFM must never read or write the BazID database directly. It specifies system-browser authorization code + PKCE, signature/issuer/audience/expiry validation, stable-subject profile linking, short-lived service-specific sessions, logout/revocation and supportable deletion flows.

## Security boundary
This starter does not implement real OIDC networking, JWKS retrieval, signature verification, credential storage or privileged BazID access. The development route accepts only a claims envelope explicitly marked as already validated by a trusted external validator placeholder. Real cryptographic validation must be implemented and security-reviewed before production.
