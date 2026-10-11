# TFM Bulk 63 — District 01 Living Streets (Unity production integration)

An independent, additive Unity Editor pass upgrades the **already saved** District 01 instead of rebuilding its existing world, replacing character skins, wiping its surface materials, or modifying Training Yard.

### New functional systems
- Four authored offline moving road vehicles follow dedicated N/S and E/W street lanes, respect an actual shared four-phase traffic controller, use obstacle-ray checks and slow/stop when required.
- Signal color presentation via MaterialPropertyBlock; shared URP material assets are unchanged.
- 22 original low-poly roadside trees plus 12 industrial utility cabinets provide roadside occlusion and detail without extra shadow-casting real-time lights.
- Dynamic daytime cycle reuses the existing directional sun; no new real-time point lights required for the signal lamps.
- A new authored Unity scene subtree \`TFM District 01 - Street Life Bulk 63\` is created **once**; subsequent runs detect it and preserve the existing scene and customizations.
- The builder uses already generated/shared URP metal, rubber, glass, trim and other material assets including previously installed CC0 PBRs; it creates only two new leaf/bark materials.

### Boundaries
These are **original modeled utility vehicles** and low-poly original vegetation; they are not licensed premium car meshes, photogrammetry or CODM assets. The signals/vehicles are deterministic offline presentation, not an automotive traffic AI, physics-based vehicle handling, police systems or multiplayer simulation. Existing three humanoid patrols remain present. The entire release still requires authored high-fidelity buildings and varied licensed human/vehicle/vegetation art, LOD/HLOD and real-device performance certification. Source checks cannot substitute for Unity 6.5 compilation and visual inspection.

### Local one-command installation
Save and close Unity, download \`Build-TFM-District.ps1\` from main and run with \`-Root "C:\Users\danie\bazaara\TFM-Task-Force-Mobile"\`. The script updates four new managed scripts, confirms the existing scene, invokes \`TFM.Editor.TFMDistrictLifeBuilder.ExpandBatch\`, saves the new scene content and continues with the optional CC0 photographed PBR materials.
