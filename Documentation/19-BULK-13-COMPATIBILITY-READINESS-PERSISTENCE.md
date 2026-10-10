# Bulk 13 - Content compatibility, map readiness and session persistence

This bulk turns the previous content/map metadata into explicit production gates.

## Added
- Content compatibility states and reports.
- Section-required content-pack compatibility checks.
- Map readiness stages from concept through release.
- Separate gameplay, navigation, mobile, PC, lighting, audio and QA validation flags.
- Session persistence snapshots with monotonically increasing sequence numbers.
- Ordered section lifecycle including content check, map check, allocation, connection, active play, recovery, results and return.
- Backend readiness/compatibility/lifecycle services and tests.
- Reference persistence tables.

## Blueprint alignment
The TFM blueprint states that 32 map names are concepts, while final playable size, mode availability and download size must come from production testing. It also requires content states, package/memory profiling, mobile validation, recovery testing and separate section prototypes.

## Production boundary
No map is marked implemented by default. No content-pack byte size is invented. Session snapshots are local-memory development records until durable production infrastructure exists.
