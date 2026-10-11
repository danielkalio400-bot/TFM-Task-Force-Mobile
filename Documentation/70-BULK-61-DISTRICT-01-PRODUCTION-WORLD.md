# Bulk 61 — Production World Foundation: District 01 — Industrial Quarter

## Production target

This bulk creates a **separate saved urban-industrial combat district**, not a replacement for the existing practice yard, and uses the user's **already textured/rigged/animated Humanoid** to create a playable character population. The previous local operator assets, FBX animation clips, controller, skin textures and material overrides are not in GitHub; the Unity Editor on the user's Windows machine produces the scene from their actual content.

Menu: **TFM > Worlds > Create District 01**. The first click:
- asks to save any unsaved Unity scenes;
- checks the existing training scene has one player + three target anchors + installed physical human mesh and a valid Humanoid Animator controller;
- saves an **independent copy** to \`Assets/_TFM/Scenes/TFMDistrict01.unity\`;
- replaces copied training yard boxes with roads, curbs, pedestrian paths, industrial block facades, bays/windows/sills, freight modules, service cars, lighting emissive panels, street furniture, perimeter and cover;
- creates deterministic original tiling URP Lit materials and PNG textures in \`Assets/_TFM/Worlds/District01\`, with mobile-oriented compressed mipmapped textures and shared materials;
- replaces copied geometric dummy visuals with **three cloned, textured, skinned and animated physical humanoid actors**; they patrol short street paths, animate Idle/Walk and are valid physics-raycast offline targets via \`TFMTargetDummy\`. The shooter can engage them using the existing accepted-shot model;
- marks the combat district with \`TFMWorldIdentity\`, disables the irrelevant timed training drills while preserving player, controller, weapon, camera, HUD, adaptive pacing; sets UI title to TFM District 01;
- adds District 01 as an enabled game scene without deleting previous scenes.

On any subsequent **Create District 01** use, the Editor opens the saved district **without overwriting it**. **TFM > Worlds > Open District 01** opens the saved world. This menu builds the actual scene in Unity, not just a source-only concept.

**Actual art truth:** UV-authored textured Humanoid mesh from the user's FBX is reused for the player and three patrols. The three opponents therefore currently share the same source character rather than representing unique military cosmetics. The environment uses *original procedural geometry* with original material textures—not photogrammetry or AAA professionally modeled assets. A production-realistic CODM-tier environment still requires externally sourced or commissioned properly licensed high-poly assets, LODs, specialized PBR texture maps, authored prop models and a content optimization pass. No CODM intellectual property is copied.

**Runtime scope:** patrol AI only, offline damage/respawn. NOT bot gunfights or multiplayer server-authoritative simulation; more advanced AI, multiple character identities, weapons, sound and material fidelity are next bulks.

## Local import

Save scene and close Unity. From repo extraction:

\`\`\`powershell
& "$env:TEMP\TFM-Unity-Updater.ps1" -Root "C:\Users\danie\bazaara\TFM-Task-Force-Mobile" -DownloadLatest -Preview
& "$env:TEMP\TFM-Unity-Updater.ps1" -Root "C:\Users\danie\bazaara\TFM-Task-Force-Mobile" -DownloadLatest
\`\`\`

Only run installation if preview has no conflicts. Reopen Unity, wait for C# compile. Run **TFM > Worlds > Create District 01** once, then Play. The scene and material textures save to the existing Unity project, not to this source-only repository.

**CI limits:** GitHub Node source tests, not Unity Editor compilation, scene execution, art fidelity, GPU telemetry or cross-device certification. Unity 6.5 local compile and opened-scene visual inspection still required before calling any release-ready.
