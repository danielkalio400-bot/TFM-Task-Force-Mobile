# Bulk 17 - Friends, clans, privacy and social moderation boundaries

This bulk implements the live-service social ownership rule from the TFM blueprint.

## Added
- Friend-request lifecycle.
- Friend relationships and blocking.
- Player privacy settings.
- Presence visibility policy.
- Party-invite privacy policy.
- Clan creation, membership and roles.
- Clan privacy/recruitment state.
- Moderation-aware social policy hooks.
- Shared runtime contract.
- Persistence tables, API routes and tests.

## Blueprint alignment
The blueprint says friends/clans must use moderation-aware visibility, privacy controls and consent. This bulk makes those requirements explicit rather than treating social graph data as automatically public.

## Privacy boundary
Blocks override social visibility and invites. Presence can be hidden. Friend and clan actions are gated by recipient settings. Production still requires authenticated routes, durable persistence, anti-spam controls, rate limits, abuse tooling and consent/age policy review.
