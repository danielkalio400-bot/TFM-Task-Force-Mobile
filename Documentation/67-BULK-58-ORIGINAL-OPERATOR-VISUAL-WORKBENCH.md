# TFM Bulk 58 — Original Operator Visual Workbench

This bulk responds to local Unity feedback that the user-imported \`character.fbx\` looks white, plain and stuck in a T-pose. A valid Humanoid rig **does not** imply realistic 3D meshes, PBR textures, clothing, or animation clips. No CODM characters or other proprietary artwork are copied.

## New Unity menus

- **TFM > Operator > Inspect Imported FBX**: inspect imported humanoid Avatar, skinned meshes, vertices/triangles, material slots with actual texture maps, Animator Controller and imported clips. Warnings are evidence, not certification.
- **TFM > Operator > Install FBX and Energy Preview**: works with the existing local \`TFM Production Operator\` installed by previous local PowerShell scripts, or with \`character.fbx\` directly if none exists. Preserves the saved training scene, movement, existing collider/weapon logic and imported meshes; hides the original capsule, sets Ignore Raycast layers and binds the motion bridge. Adds **original cyan energy ring cosmetics** at the operator's feet and waist, with mesh/URP Lit material assets created locally inside \`Assets/_TFM/ProductionArt/Generated\`. Idempotent; Undo-aware; artist saves the scene explicitly.
- **TFM > Operator > Apply Tactical Material Preview**: optional, explicit styling for material slots without texture maps. Keeps existing textured slots and face/skin material untouched. Generated graphite/visor URP Lit materials are not a substitute for UV-authored texture maps and detailed armor meshes.

## Performance

The effect uses tiny static torus meshes, no dynamic lights, no colliders and material property blocks; on entry/low-quality mobile devices, it disables its optional second ring. Runtime scene assets are reused rather than regenerated every frame. Any emission bloom requires scene post-processing configuration.

## For the local PowerShell ZIP install

From \`C:\Users\danie\bazaara\TFM-Task-Force-Mobile\`, **exit Unity before updating**:

\`\`\`powershell
& "$env:TEMP\TFM-Unity-Updater.ps1" -Root $PWD.Path -DownloadLatest -Preview
& "$env:TEMP\TFM-Unity-Updater.ps1" -Root $PWD.Path -DownloadLatest
\`\`\`

Do not use \`-ForceManagedOverwrite\` unless any conflicts are understood. The managed importer reads the canonical Unity source manifest. On reopening Unity, open \`TFM > Open Training Yard\` and invoke the new operator menus. The user's local \`TFMQuickOperatorInstaller.cs\` is not in the source manifest and is left alone.

**Limitations:** This is cosmetic preview and art diagnostics, not a realistic asset pack. Properly licensed detailed operator mesh, UV-mapped PBR textures, retargeted locomotion clips and a tested animation controller are still needed. CI is Node source testing, **not** Unity Editor compilation, hardware benchmarking or QA.
