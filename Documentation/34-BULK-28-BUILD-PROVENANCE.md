# Bulk 28 - Build provenance and artifact-integrity foundation

This bulk extends TFM's release process with build provenance for Android, iOS and Windows artifacts.

## Added
- Source-commit provenance.
- Unity-version record.
- Artifact-integrity reference.
- Non-secret signing-identity reference.
- Content-manifest reference.
- Artifact verification.
- Release-candidate promotion.
- Artifact revocation.
- Build audit history.
- Client DTOs, persistence, routes and tests.

## Blueprint alignment
The TFM blueprint requires a release process, platform compliance and rollback readiness, and identifies signed-build auditing and credential leakage as governance concerns. This bulk makes the build-traceability boundary explicit.

## Security boundary
Only signing identity references are stored. No private keys, certificates, passwords or privileged signing tokens belong in this service.

## Production boundary
Real release builds still require CI-generated artifacts, deterministic/reproducible-build controls where applicable, actual platform signing/notarization, secure key management, malware scanning and store-native verification.
