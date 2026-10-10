# Create the REAL Unity project via Unity Hub

Unity Hub -> New project -> Unity 6 LTS -> Universal 3D template.
Set the project location to GameClient/TFM-Unity.
Do not create a project using the Built-In or HDRP template.

Committed platform targets:
- Android
- iOS
- Windows PC

Install the corresponding Unity build-support modules for the platforms you build. iOS builds require a supported macOS/Xcode environment for final native compilation/signing.

This scaffold intentionally does not fabricate Unity's Packages/manifest.json,
ProjectSettings, URP assets or Unity .meta files. Unity Hub is responsible for
creating those files with versions that match the installed editor.

Then run ../Import-TFM-StarterAssets.ps1 from the TFM repository root to copy
StarterAssets into TFM-Unity/Assets/_TFM. Existing assets are never overwritten.

Open the default scene and press Play. The C# bootstrap creates an original 3D
training yard, a controllable third-person player, collision, an orbit camera
and a lightweight HUD at runtime.

Editor controls:
- WASD or arrow keys: move
- Left Shift: sprint
- Space: jump
- Hold the right mouse button: look
- Hold the left mouse button: fire
- R: reload

Mobile controls:
- Drag on the left half of the screen: move
- Drag on the right half of the screen: look
- Tap JUMP: jump
- Hold FIRE: fire
- Tap RELOAD: reload

This is the first local gameplay prototype. It includes target-range combat,
but authentication, networking, progression, final art and multiplayer remain
separate milestones.
