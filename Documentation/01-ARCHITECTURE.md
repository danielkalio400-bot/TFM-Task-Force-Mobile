# TFM architecture

- TFM is a separate repository OUTSIDE the three Bazaara ecosystems.
- Client: real Unity 6 Universal 3D project created by Unity Hub.
- Identity: BazID via external browser OIDC Authorization Code + PKCE.
- Backend: separate player profile, progression, moderation and APIs.
- Real-time multiplayer: authoritative dedicated-server plan (not implemented).
- Data: isolated TFM database and audited administrative access.
- Shared: versioned contracts, no direct writes to Bazaara databases.
- Delivery: Android/iOS with platform review, age-appropriate design and testing.

This scaffold is infrastructure for development, NOT an operational game.