# Bulk 25 - Patch release and live-readiness delivery authority

This bulk extends TFM's existing content-delivery metadata into a staged patch/release policy.

## Added
- Android, iOS and Windows patch manifests.
- Alpha, beta and stable release channels.
- Minimum-supported and target build metadata.
- Integrity references.
- Staged rollout percentages.
- Mandatory vs optional update decisions.
- Previous-patch rollback state.
- Release audit history.
- Client DTOs.
- Persistence tables, routes and tests.

## Blueprint alignment
The roadmap's live-readiness gate calls for telemetry, patch delivery, player safety and a release process, followed by platform compliance, operations and rollback readiness.

## Platform boundary
This does not bypass Google Play, Apple App Store or Windows distribution requirements. It does not host or sign binaries. The patch service is only release-control metadata that production package/CDN/platform systems can consume.

## Production boundary
Real rollout requires signed manifests, secure build provenance, CDN/package hosting, app-store/platform review, authenticated release tooling, durable databases and production observability.
