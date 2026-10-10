# Create the REAL Unity project via Unity Hub

Unity Hub -> New project -> Unity 6 LTS -> Universal 3D template.
Set **Project name** to `TFM-Unity` and **Location** to the repository's
`GameClient` folder. Hub appends the name automatically, producing
`GameClient/TFM-Unity`. Choosing that full path as the Location produces an
extra `TFM-Unity` folder inside it.
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

The updater reads the versioned `TFM-Source-Manifest.txt` and installs all
maintained C# sources, including Training, Performance, Gameplay, UI and Editor
components. It checks every file before writing and stores only installed
SHA-256 hashes in the actual Unity project's `ProjectSettings/TFMSourceHashes.json`.
**No backup folders, copies, ZIP archives or .bak files are created.** Save
custom scripts in Git before updating. The installer refuses to overwrite
local changes it cannot prove came from a previous managed install; use
`-ForceManagedOverwrite` only after explicitly reviewing such differences.

For a Git clone or extracted ZIP, update the source files and then run:
```powershell
./Update-TFM-Unity.ps1 -Root "$PWD" -Preview
./Update-TFM-Unity.ps1 -Root "$PWD"
```
To fetch the latest manifest and scripts directly from GitHub, use
`-DownloadLatest`; transient download staging is removed from the OS temp
directory. `-SourceRoot` can point to a different local checked-out source.
No Unity-generated `.meta`, `Packages`, `Library` or custom scenes are
overwritten. Install missing Unity editor modules through Unity Hub.

The importer and updater recognize `GameClient/TFM-Unity`, `TFM-Unity`,
and nested project paths. Pass `-ProjectPath` when there is more than one.
A complete project contains `Assets`, `Packages/manifest.json` and
`ProjectSettings/ProjectVersion.txt`. A saved selection lives in the ignored
`.tfm-unity-project.json`. No secret-bearing Editor command lines are printed.

Use `./Open-TFM-Unity.ps1` for future launches. It reads the saved selection,
verifies that the TFM scripts exist, and launches that exact project with
`TFM.Editor.TFMTrainingSceneBuilder.OpenTrainingYard`. It needs no download.
To change the saved project, run the updater again with `-ProjectPath`.
Use `-Preview` on the importer/updater to display the selection without writes.
Run the scaffold generator from the complete repository or extracted ZIP; it
copies the maintained scripts instead of regenerating old two-script templates.

On first import, the Editor creates `Assets/_TFM/Scenes/TFMTrainingYard.unity`
and persistent materials. It opens the yard automatically if the current scene
is an unmodified default scene. Otherwise use **TFM > Open Training Yard**.
If an untitled scene is open, the builder first saves it to a unique file under
`Assets/_TFM/Scenes/Recovered`. Its objects are preserved; this lets Unity create
the training scene additively without the "untitled scene unsaved" exception.
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

## Realistic art replacement (Bulk 53)

Import original/licensed URP prefabs, create a **TFM Production Art Profile** via Assets > Create, assign operator, environment and physical practice target prefabs, then open the saved Training Yard and use **TFM > Production Art > Apply Imported Prefabs**. The installer retains the existing gameplay systems, disables prototype visual objects, uses Undo and leaves the scene unsaved for review. See `Documentation/61-BULK-53-REALISTIC-ASSET-INTEGRATION.md` for colliders, rigging and verification. Code changes alone do not provide realistic meshes.
