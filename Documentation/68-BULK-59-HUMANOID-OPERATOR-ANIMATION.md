# Bulk 59 — Humanoid Retargeting & Operator Animation Controller

## Status

Source tooling for an **artist-supplied animation pipeline**. No licensed Idle/Walk/Run/Fire/Reload/Aim clips are bundled, and Unity Editor compilation/playmode was not validated by the repository's Node-only CI. The operator's verified textured \`character.fbx\` on the user's Windows computer is not uploaded to GitHub.

## Unity menu workflow

1. Keep the correctly textured TFM Production Operator in the saved Training Yard. Exit Play Mode.
2. **TFM > Operator > Animations > 1 - Prepare Animation Folders** creates \`Assets/_TFM/ProductionArt/Animations/Imports\` and \`Generated\`.
3. Import appropriately licensed **Idle.fbx**, **Walk.fbx**, and **Run.fbx** (e.g. Humanoid FBX animations without skin) into \`Imports\`; optional **Fire.fbx**, **Reload.fbx**, **Aim.fbx**.
4. **2 - Configure Imported Humanoid Clips** changes only FBX files inside the \`Imports\` directory to Human/Create From This Model/import animations; sets locomotion clips to loop. It does not touch character.fbx, texture imports, material assets, or gameplay scenes.
5. **3 - Audit Animation Clips** checks Human-motion and identifies Idle/Walk/Run and optional actions. Refuses ambiguous duplicates.
6. **TFM > Open Training Yard** then **4 - Build and Bind Locomotion** generates \`Generated/TFMOperator.controller\` only if absent. Builds 1D blend tree for normalized \`Speed\` (0 Idle, 0.67 Walk, 1.0 Run), optionally action states for Fire/Reload; binds Animator on the existing textured operator and existing TFM motion bridge. Existing generated controller is **not overwritten** if re-run. Scene is dirty; human must inspect and **Ctrl+S**.

No clips: a user gets an explicit "Idle, Walk and Run ... required" diagnostic, not a fake animation or implicit success. \`Aim.fbx\` is audited, **not wired** because the current TFM input implementation does not expose an aim-down-sights action.

The motion bridge still uses the physical CharacterController as the only authoritative position; root motion is disabled, keeps pose cosmetic, and adds optional \`IsFiring\` / \`IsReloading\` driven by existing offline practice input and weapon. The bridge does not alter scoring, damage, networking or ammo.

## User's Windows PowerShell updater

Save the Unity scene and close the Editor. From \`C:\Users\danie\bazaara\TFM-Task-Force-Mobile\`:

\`\`\`powershell
& "$env:TEMP\TFM-Unity-Updater.ps1" -Root $PWD.Path -DownloadLatest -Preview
& "$env:TEMP\TFM-Unity-Updater.ps1" -Root $PWD.Path -DownloadLatest
\`\`\`

Review any managed-script conflicts; do **not** use \`-ForceManagedOverwrite\` blindly. Local \`TFMTexturePreview.cs\`, extracted \`Ch49_1001\`/\`1002\` textures and URP material assets are not in the source manifest and must remain untouched. No .zip backups, Unity Library, Temp or duplicate asset copies are put in the repository.

Optional no-modification batch diagnostic after importing actual FBX clips:

\`\`\`powershell
$unity = "C:\Program Files\Unity\Hub\Editor\6000.6.5f1\Editor\Unity.exe"
$project = "C:\Users\danie\bazaara\TFM-Task-Force-Mobile\GameClient\TFM-Unity\TFM-Unity"
& $unity -batchmode -quit -projectPath $project -executeMethod TFM.Editor.TFMOperatorAnimationPipeline.AuditBatch -logFile "$env:TEMP\TFM-Animation-Audit.log"
\`\`\`

**Next:** obtain original/licensed Humanoid animation FBXs, run the new menus, inspect gait and blend transitions on Windows, and test mobile fps and frame pacing. Retargeting may require rig mapping inspection in Unity for nonstandard FBXs.
