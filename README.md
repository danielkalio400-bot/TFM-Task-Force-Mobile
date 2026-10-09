# TFM - Task Force Mobile

Independent Unity 6 mobile game project. BazID will provide identity through an
approved OIDC/PKCE flow; TFM owns its own progression, servers and game data.

THIS IS A PROJECT SCAFFOLD, NOT A PLAYABLE GAME.

## Unity setup
1. Install Unity Hub and a supported Unity 6 LTS editor with Android Build Support.
2. In Unity Hub create a **Universal 3D** project at:
   `GameClient/TFM-Unity` (this directory is intentionally NOT pre-created).
3. After Unity finishes creating the project, run the generated
   `Import-TFM-StarterAssets.ps1` to import the TFM code and folder structure.
4. Open Unity and confirm the imported C# scripts compile.
5. Design original scenes and implement gameplay; no scenes are shipped here.

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