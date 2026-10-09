# TFM architecture

- TFM is a separate repository OUTSIDE the Bazaara ecosystems.
- Client: real Unity 6 Universal 3D / URP project created by Unity Hub.
- Platforms: Android, iOS and Windows PC are committed targets.
- Shared core: gameplay, networking, progression, weapons, vehicles, maps, AI and game-service contracts.
- Mobile input: touch HUD + optional gyro aiming.
- PC input: keyboard/mouse + controller.
- Graphics: scalable device presets; mobile prioritizes thermals, battery and stable frame pacing; PC can expose higher quality and refresh-rate tiers when validated.
- Identity: BazID via external browser OIDC Authorization Code + PKCE.
- Backend: separate player profile, progression, moderation and APIs.
- Real-time multiplayer: authoritative dedicated-server plan (not implemented).
- Data: isolated TFM database and audited administrative access.
- Shared: versioned contracts, no direct writes to Bazaara databases.
- Delivery: Android/iOS/Windows builds with platform-specific QA, compliance and performance testing.

This scaffold is infrastructure for development, NOT an operational game.
