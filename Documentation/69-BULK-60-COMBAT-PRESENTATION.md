# TFM Bulk 60 — Original CODM-Informed Combat Presentation

**Reference only:** Activision's public COD Mobile controls documentation discusses a separate touch-control movement/look scheme, advanced firing and aim, reload, and customizable button regions. We implement distinct original TFM UI and animation code. No proprietary HUDs, art, audio, animation, or game assets are obtained or copied.

Public design references:
- https://blog.activision.com/call-of-duty/2019-10/Getting-a-Grip-on-the-Call-of-Duty-Mobile-Controls
- https://www.callofduty.com/uk/en/blog/2024/03/call-of-duty-warzone-mobile-complete-control-plus-customization-controller-options

## Gameplay changes

1. **ADS / camera:** Hold right mouse on Windows (also used for the existing look input), hold gamepad left trigger, or tap a dedicated mobile AIM button to toggle. Smooth camera FOV/shoulder/distance with collision-safe sphere casting. Independently authored values configurable in the Inspector.
2. **Shot feedback:** A real accepted TFM training shot emits a local-only \`ShotFired\` event; camera provides a subtle deterministic kick and the operator visual bridge gives a small upper-chest pose accent when no authored combat overlay exists. **Practice hit/damage, ammunition and reload authority are unchanged.**
3. **Reload:** Existing weapon state drives a reload percentage in the HUD, and animation booleans. No fabricated reload sequence is claimed.
4. **Animation:** Runtime bridge now drives \`IsAiming\`, \`IsFiring\` (based on accepted shots, not just held button), and \`IsReloading\`. Compatible existing Idle/Walk/Run blend tree is unchanged. Optional Fire/Reload/Aim Humanoid FBX clips may be imported into the current \`Assets/_TFM/ProductionArt/Animations/Imports\`.
5. **Optional upper-body layer:** \`TFM > Operator > Combat > Auto-Integrate Combat Presentation\` detects imported action clips, creates a masked torso/arms/head Animator layer, and binds states when present. Legs continue base locomotion. No mask/layer created when no action clips exist. Adds controller parameters only when missing. Repeated calls don't duplicate existing layer/states. Scene remains manually saved by user.

## Windows installation

Close Unity after saving the Training Yard, then from the extracted TFM repository root:

\`\`\`powershell
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/danielkalio400-bot/TFM-Task-Force-Mobile/main/Update-TFM-Unity.ps1" -OutFile "$env:TEMP/TFM-Unity-Updater.ps1"
& "$env:TEMP/TFM-Unity-Updater.ps1" -Root $PWD.Path -DownloadLatest -Preview
& "$env:TEMP/TFM-Unity-Updater.ps1" -Root $PWD.Path -DownloadLatest
\`\`\`

Verify the preview reported no conflicts before running the install line; do not force overwrite local scripts. Local \`TFMTexturePreview.cs\`, restored materials/skin textures, original character and Idle/Walk/Run FBXs are unaffected.

Reopen Unity, allow C# compilation, open saved Training Yard and press Play to test right mouse ADS, mouse-left practice fire, and reload. The core visual feedback works without action FBXs. If optionally importing licensed action clips, run **TFM > Operator > Animations > 2 - Configure Imported Humanoid Clips** and then **TFM > Operator > Combat > Auto-Integrate Combat Presentation**.

## Important limits

This adds FPS-game control presentation to a third-person training scene, **not** actual authentic weapon-holding meshes, rig authored poses, CODM weapon systems, authoritative multiplayer, or production-ready polished animations. The upper-chest procedural fallback is purposely minor to keep the already-working locomotion stable. Node CI checks source integrations, **not** Unity 6.5 compilation or on-device performance. Validate on Windows, Android and iOS.
