# BazID integration - implementation plan only

Use OAuth 2.0 Authorization Code with PKCE and OIDC discovery for native apps.
Use a system browser + secure app redirect; DO NOT use an embedded password form.
Validate issuer, audience, signature, expiry and nonce as applicable.
Keep tokens in OS-protected storage; never store BazID passwords or secrets
in the Unity project. Backend issues only scoped game service sessions.
Separate BazID identity from TFM game data and enforce revocation.

The scaffold contains NO authentication implementation or credentials.