# TFM Bulk 51 — Unity player format checks and build preflight

The previous batch-build launcher considered **any nonempty APK** an Android artifact. A Windows EXE containing arbitrary text plus an empty `_Data` directory was also accepted, and an empty Xcode project folder was sufficient for iOS. These tests were suitable as path placeholders only, not build-artifact verification.

This bulk verifies the Android ZIP central directory with expected `AndroidManifest.xml`, `classes.dex`, and Unity runtime files; Windows x64 PE format and an actual Unity `_Data` resource file; and an iOS `Unity-iPhone.xcodeproj/project.pbxproj` file with the required Xcode project marker. Android and Windows binary reports now include a **SHA-256 digest and size** after successful real Unity process completion. Existing output paths are rejected before a build starts, even if the path contains invalid files.

The launcher also requires a real Unity `Packages/manifest.json` and the appropriate imported gameplay and Editor build sources inside the target project's `Assets` tree. This prevents a misleading failure late in a batch build when someone selected an unrelated Unity project.

Automated Node tests use tiny **format fixtures** for parser regression, including corrupt/missing files. They do not construct a usable APK/EXE/IPA and their existence does not certify a game. These checks are *structural plausibility* checks, **not** cryptographic signing validation, Unity compilation, mobile-device Play Mode testing or functional compatibility certification. No 30 MB archive has been created or padded.
