# Bulk 27 - Product governance and maturity-control foundation

This bulk implements the final risk/product-governance section of the TFM blueprint.

## Added
- Explicit risk register for scope inflation, mobile-device diversity, server cost/complexity, credential leakage, content originality, harassment/safety and implementation overpromising.
- Physical-device validation profiles.
- Capacity-pilot, credential-security, player-safety and rollback evidence records.
- Asset provenance and rights-evidence records.
- Vertical-slice evidence gate.
- Scaffold/prototype/internal-beta/release-ready maturity labels.
- Release-ready blocking requirements.
- Governance audit history.
- Client DTOs, persistence, routes and tests.

## Blueprint alignment
The blueprint says to mitigate scope inflation with one playable vertical slice, repeatedly test physical target phones, pilot small online sessions before scaling, keep BazID secrets server-side, preserve asset provenance, support reporting/blocking/youth protections and clearly distinguish scaffold, prototype, internal beta and release-ready states.

## Original-content boundary
TFM may take inspiration from the tactical-shooter genre but must use original or properly licensed maps, characters, UI, audio and other assets. Protected CODM content is not treated as reusable project material.

## Production boundary
The governance service tracks internal evidence and maturity claims. It does not replace physical-device QA, production security review, legal/IP review, platform certification or live-service operations.
