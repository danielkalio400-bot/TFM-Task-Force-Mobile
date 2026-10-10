# TFM Bulk 55 — Production Operator Camera, Combat and World Retention

## Implemented in source

- Importing a detailed tactical operator places the entire prefab instance hierarchy on Unity's built-in **Ignore Raycast** layer (2), with Undo recording. This prevents its authored meshes/colliders from becoming obstacles to the existing third-person camera and center-screen hitscan weapon, both of which exclude that layer. Scene validation verifies the exclusion.
- The production-art installer no longer deactivates arbitrary training-yard children. It replaces only the 11 named original geometry blocks, disabling their root Renderer and Collider **without** disabling their GameObjects, scripts, or locally authored children. Unknown scene objects remain untouched. Physical shooting targets keep their gameplay anchors.
- Legacy player and target visuals receive the same component-scoped treatment; validation checks whether their renderers are still shown rather than relying on GameObject activation state.
- Humanoid Animator root motion is disabled at runtime by the operator bridge. The existing player CharacterController remains authoritative while imported animations drive visuals.

## Real Unity acceptance

Run **TFM > Production Art > Apply Imported Prefabs**, then **Validate Open Scene** and inspect the scene visually before saving. Play the scene, navigate around real colliders, rotate the camera near buildings and cover, and fire into all three authored physical practice targets. Inspect recoil/locomotion clips and confirm no renderers or target collisions are suppressed unexpectedly. Profile URP materials, LODs and frame pacing on real Android, iOS and Windows devices.

**Not included:** licensed operator FBX, realistic environment meshes, new animations, Unity compilation, or device builds. Source-only Node CI cannot certify graphics or engine behavior.
