# Bulk 31 follow-up — Unity import integrity

A verification review found that the older updater copied only ten explicitly named C# scripts. The real TFM gameplay client already contains over 250 C# source files. That updater therefore did not import the new training, performance and related dependencies.

## Correction
- Versioned import manifest enumerates **all** maintained C# files under the starter Unity namespace.
- Offline installer reads Git-managed source; `-DownloadLatest` optionally stages all files from GitHub in the OS temp directory.
- SHA-256 verification of all source files before mutation and of each installed file after copying.
- Tracks hashes in the selected Unity project's `ProjectSettings/TFMSourceHashes.json`; refuses unexplained local modifications unless the developer explicitly passes `-ForceManagedOverwrite`.
- No backup directories, ZIP packages, duplicate source snapshots, generated Unity `.meta` files, or changes to user-made scenes.
- Import smoke checks enforce manifest completeness, so new scripts cannot silently be omitted.

## Verification required on devices
Import into genuine Unity 6 + URP and compile. If the project already contains local scripts installed using the previous ten-file updater, an initial migration may require the explicit `-ForceManagedOverwrite` flag **after committing personal edits to Git**. Test Windows and both mobile platforms. CI source checks are not an Editor compilation.
