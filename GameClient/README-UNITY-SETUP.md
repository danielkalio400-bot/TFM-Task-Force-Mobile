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

For the initial import, run `./Import-TFM-StarterAssets.ps1` from the repository
root. To update an existing project, close Unity and run:

```powershell
./Update-TFM-Unity.ps1 -Root "C:\Users\danie\bazaara\TFM-Task-Force-Mobile" -OpenUnity
```

The updater works with ZIP downloads as well as Git clones. It checks all ten
required scripts before copying, backs up changed scripts under `backups`,
preserves `.meta` files and custom scenes, and verifies installed file hashes.
It can locate and reopen the project's Unity version in the standard Hub location.

On first import, the Editor creates `Assets/_TFM/Scenes/TFMTrainingYard.unity`
and persistent materials. It opens the yard automatically if the current scene
is an unmodified default scene. Otherwise use **TFM > Open Training Yard**.
The level geometry, player, camera, light and three targets are visible before
Play. Press Play for movement, shooting and the HUD.

The scene builder saves and reloads the scene to validate the player, camera,
weapon and HUD references. Existing generated scenes are preserved on updates.
Use **TFM > Validate Training Scene** for a repeatable check, or **TFM > Build
Windows Training Demo** to build a standalone executable with Windows Build
Support installed. The original startup callback also supports Play from the
default scene.

If the TFM menu does not appear, open **Window > General > Console** and inspect
the first red error. A compile error in any project script can prevent the Editor
builder from loading. The input code supports New, Legacy and Both input modes;
the Both-mode `TouchPhase` ambiguity in the original prototype has been corrected.

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
