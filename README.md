# TFM - Task Force Mobile

Independent Unity 6 mobile + Windows PC game project. TFM targets Android, iOS and Windows PC from the shared gameplay core, with platform-specific input, UI, graphics and performance profiles.

BazID will provide identity through an approved OIDC/PKCE flow; TFM owns its own progression, servers and game data.

The repository includes C# source for a local 3D training-yard prototype.
Authentication and multiplayer are not implemented yet.

## Platform targets
- Android
- iOS
- Windows PC

Mobile remains the primary optimization focus, but Windows PC is a committed release target rather than a future possibility.

## Unity setup
1. Install Unity Hub and a supported Unity 6 LTS editor.
2. Install the platform modules required for the builds you intend to make: Android Build Support, iOS Build Support on a supported macOS build environment, and Windows Build Support.
3. In Unity Hub create a **Universal 3D** project with **Project name: TFM-Unity**
   and **Location: `<repository>/GameClient`**. Hub appends the project name;
   the resulting folder should be `GameClient/TFM-Unity`.
4. After Unity finishes creating the project, run the generated
   `Import-TFM-StarterAssets.ps1` to import the TFM code and folder structure.
5. Wait for compilation. Unity generates a saved training scene on first import.
   Choose **TFM > Open Training Yard**, then press Play.
6. Use WASD to move, Left Shift to sprint, Space to jump and hold the right
   mouse button to orbit the camera. Use the left mouse button to fire and R to
   reload. Touch movement, aiming, firing, jumping and reload are enabled on mobile.

For existing projects, `Update-TFM-Unity.ps1 -Root <repository-path> -OpenUnity`
updates scripts with backups and verifies the installation without requiring Git.
It detects standard and nested project folders. If more than one exists, select
the one you want with `-ProjectPath "GameClient/TFM-Unity/TFM-Unity"` (or the
outer path). The selection is saved locally; no project folders are moved.
After updating, run `./Open-TFM-Unity.ps1` to open the selected project and its
training scene without downloading again. Close Unity before updating.
Use **TFM > Validate Training Scene** to check the saved scene and **TFM > Build
Windows Training Demo** to create an executable locally.

## Shared core / platform layers
The gameplay, networking, progression, weapons, vehicles, maps, AI and game-service logic should stay shared where practical.

Platform-specific layers handle:
- Mobile: touch HUD, gyro aiming, mobile graphics tiers, thermal/battery scaling, device-specific frame pacing.
- Windows PC: keyboard/mouse, controller, PC HUD/input presentation, higher graphics tiers, higher refresh-rate support where stable.

## Backend starter
- Requires Node.js 20+.
- Run `cd Backend; npm start` (no dependencies needed) to start a local-only
  catalog/status endpoint on http://127.0.0.1:4100.
- Run `cd Backend; npm test` for smoke tests.
- The server has no BazID integration, no player accounts, no matchmaking and
  no multiplayer networking yet. Do not expose it publicly.

## Ownership
Bazaara ecosystem applications are separate and remain unchanged.
TFM is a standalone project and requires secure BazID integration later.
