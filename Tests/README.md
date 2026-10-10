# Planned verification

## Available checks

- Run `pwsh -File Tests/Update-TFM-Unity.Tests.ps1` to exercise installation,
  incomplete-source rejection, missing-project rejection, backups, preservation
  of Unity GUIDs/local scenes, and an idempotent second update. Fixtures remain
  in a uniquely named temporary directory for inspection.
- In Unity, use **TFM > Validate Training Scene**. First generation saves and
  reloads the scene before checking component counts and serialized references.
- For CI with a licensed Unity installation:
  `Unity -batchmode -projectPath <project> -executeMethod TFM.Editor.TFMTrainingSceneBuilder.ValidateBatch -logFile <log>`.
  The method exits with 0 on success and 1 on failure.
- `Tests/UnityCompile/UnityCompile.csproj` provides a compile-only check with
  `dotnet build`. Pass `-p:UnityReferenceDirectory=<UnityEngine-module-folder>`,
  `-p:InputSystemAssembly=<Unity.InputSystem.dll>` and optionally
  `-p:UnityEditorAssembly=<UnityEditor.dll>`. Run `-p:InputBackend=New`, `Legacy`
  and `Both`. Input System normally lives in the Unity project's
  `Library/ScriptAssemblies`. No packages are added to the Unity project.

Cloud verification used .NET with the third-party Digitalroot.References.Unity
6000.0.75 reference package and UnityTechnologies.UnityEditor 2020.2.2.1 Editor
assembly. These catch C# and referenced-API errors, including the Both input-mode
regression; they are not a Unity 6000.6.5f1 import, render or Play Mode test.
The cloud environment has no Unity Editor/license. Run the Unity checks above
on the local installation before treating the demo as build-verified.

### Untitled-scene regression (requires Unity)

Use a disposable Universal 3D project for each first-import case:

1. Leave a clean, untitled scene open, then import the TFM scripts. Confirm the
   training yard is generated and opens without an additive-scene exception.
2. In a fresh project, add a cube to an untitled scene before importing. Confirm
   that scene remains open with its cube, is saved under
   `Assets/_TFM/Scenes/Recovered`, and the training scene is generated separately.
3. With a training scene already generated, create another untitled scene and
   use **TFM > Validate Training Scene**. Confirm validation succeeds, the current
   scene remains open, and the new recovery file does not overwrite the first.
4. Reopen each recovery scene and check its objects. Repeat validation with a
   modified, named scene and confirm its changes are neither saved nor discarded.

## Remaining platform verification

- Unity compile/playmode tests after creating the Universal 3D project.
- Android performance benchmarks on physical phones/tablets.
- iOS performance benchmarks on physical supported devices.
- Windows PC performance tests across minimum/recommended/high-end hardware.
- Touch, gyro, keyboard/mouse and controller input tests.
- HUD/aspect-ratio/safe-area tests across mobile and PC.
- BazID sign-in and session-revocation integration tests.
- Network latency, reconnect and server load/observability tests.
- Cross-platform gameplay-equivalence tests.
- Privacy, moderation, security and release acceptance tests.
- Backend smoke tests: `cd Backend; npm test`.
