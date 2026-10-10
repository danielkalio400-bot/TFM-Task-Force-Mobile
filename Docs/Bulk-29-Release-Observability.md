# Bulk 29 — Release Observability and Quality Gates

Bulk 29 adds a deterministic quality-control layer between verified release artifacts and staged rollout continuation.

Included:
- Aggregate quality sample intake for Android, iOS and Windows.
- Cohort-aware crash, ANR, frame-time, memory, thermal, disconnect and battery metrics.
- Platform-specific minimum sample sizes and quality budgets.
- Stable-baseline comparison with configurable regression limits.
- Rollout decisions: continue, hold, rollback-review.
- Queryable samples, baselines, reports and bounded audit history.
- Unity serializable DTOs.
- Automated Node tests.

API:
- GET /v1/runtime/release-observability
- POST /v1/dev/release-quality/samples
- GET /v1/dev/release-quality/samples
- POST /v1/dev/release-quality/baselines
- GET /v1/dev/release-quality/baselines
- POST /v1/dev/release-quality/evaluate
- GET /v1/dev/release-quality/reports/:reportId
- GET /v1/dev/release-quality/audit

Boundary: this is a development control plane. It does not ingest Google Play Android Vitals, Apple Organizer/MetricKit, Windows crash dumps, production APM data or real user identifiers automatically, and it never performs an automatic production rollback.
