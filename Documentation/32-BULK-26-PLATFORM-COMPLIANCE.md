# Bulk 26 - Platform compliance and internal release certification

This bulk extends TFM live readiness with an explicit internal compliance gate for Android, iOS and Windows.

## Added
- Per-platform compliance checklist.
- Privacy-disclosure gate.
- Data-safety disclosure gate.
- Account-deletion flow gate.
- Accessibility-review gate.
- Content-rating questionnaire gate.
- Permissions-review gate.
- Support-contact gate.
- Operations/rollback evidence gate.
- Evidence-reference audit history.
- Release-candidate certification report.
- Client DTOs, persistence, routes and tests.

## Blueprint alignment
The live-readiness phase requires platform compliance, operations and rollback readiness after telemetry, patch delivery, player safety and the release process.

## Certification boundary
A candidate state means the internal TFM checklist passed. It is not an external store, legal, ratings-board, privacy or accessibility certification.

## Production boundary
Actual releases still require platform-native submission, official policy review, final age/content rating, signed builds, legal/privacy review, accessibility testing, device QA and production incident procedures.
