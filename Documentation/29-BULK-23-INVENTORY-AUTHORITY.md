# Bulk 23 - Server-owned inventory transaction authority

This bulk implements the inventory ownership rule in the TFM blueprint.

## Added
- Server-owned inventory mutation boundary.
- Trusted authority-source allowlist.
- Idempotent mutation receipts.
- Grant, consume and revoke transaction kinds.
- Negative-balance prevention through the existing ledger.
- Authenticated client balance/history reads.
- Client DTOs.
- Shared runtime contract.
- Persistence tables, routes and automated tests.

## Blueprint alignment
The blueprint requires inventory to use server-owned transaction boundaries with no blind client-side mutations.

## Authority boundary
The legacy authenticated client mutation endpoint is disabled by this bulk. Mutations are accepted only through the development authority route and only from an explicitly trusted server-side source type.

## Production boundary
The authority is still an in-memory prototype. Production requires authenticated service identities, transactional database writes, cross-process replay protection, fraud monitoring, durable audit history and inventory recovery tooling.
