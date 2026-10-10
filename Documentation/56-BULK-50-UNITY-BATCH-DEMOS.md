# TFM Bulk 50 — Build the actual Training Yard with Unity batch mode

This repository holds **importable Unity 6 C# sources and an Editor scene generator**, not a committed Unity project or a compiled APK/EXE/IPA. The editor class `TFMPlayableDemoBatchBuild` now provides unattended real Unity `BuildPipeline.BuildPlayer` entry points after it validates the saved Training Yard. `Backend/scripts/unity-demo-build.mjs` is a cross-platform Node 20 launcher that checks that you point it at an existing Unity project, rejects unknown platforms, supplies `-buildTarget` and the build output, and requires an actual generated artifact afterward. The Windows check requires an EXE **and** its `_Data` directory. The Android check requires a nonempty APK. iOS produces an **Xcode project**, not a signed IPA, and requires a Mac with iOS Build Support.

## Prerequisites
1. Create or open a **real Unity 6 URP project** via Unity Hub (Unity Editor installation not supplied).
2. Import the repository `GameClient/StarterAssets/Assets/_TFM` folder into the Unity project's `Assets` folder; use `Update-TFM-Unity.ps1` on Windows where appropriate.
3. Install the chosen Android/Windows/iOS Unity platform modules and required platform SDK toolchains. Select a platform supported by that Editor machine.

## Commands (in the repo root, example paths only)

Android:
```sh
node Backend/scripts/unity-demo-build.mjs --unity "/path/to/Unity" --project "/path/to/UnityProject" --platform android --output "/path/to/new/TFM-training.apk"
```

Windows:
```sh
node Backend/scripts/unity-demo-build.mjs --unity "/path/to/Unity" --project "/path/to/UnityProject" --platform windows --output "/path/to/new/TFM-training.exe"
```

iOS (macOS, exports Xcode):
```sh
node Backend/scripts/unity-demo-build.mjs --unity "/Applications/Unity/Hub/Editor/6.x/Unity.app/Contents/MacOS/Unity" --project "/path/to/UnityProject" --platform ios --output "/path/to/new/TFM-iOS-Xcode"
```

`--dry-run` prints the intended command after validating prerequisites; it **does not run Unity or create a game build**. Failed builds exit nonzero, output paths must be fresh and CI tests only cover command correctness and static Editor integration. No 30 MB target is fabricated. Android and Windows require on-device startup/performance tests, while an iOS Xcode project additionally needs Xcode signing and packaging.
