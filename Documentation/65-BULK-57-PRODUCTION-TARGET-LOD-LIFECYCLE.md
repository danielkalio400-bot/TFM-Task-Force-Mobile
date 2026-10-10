# TFM Bulk 57 — Realistic Target Hierarchy, LOD and Respawn Integrity

## Changed

In a realistically authored Unity 6 URP training scene, a practice-target prefab may contain several LODGroup stages, MeshRenderers, skinned submeshes, renderers that begin disabled by LOD logic, separate hit colliders and animator-driven visual parts. Tracking only renderers enabled on the first frame does not safely hide every visual during a target's death/respawn.

TFMTargetDummy now keeps a reference to the installed **TFM Production Practice Target** prefab root and deactivates/reactivates that child **as a unit** when the target is destroyed/reset. The TFMTargetDummy gameplay anchor remains active throughout, so scoring, training-event callbacks, target motion and coroutine-driven respawn survive. Original primitive Body/Head blockouts remain separately hidden. Only legacy, unconverted practice targets continue component-based renderer/collider switching and training-color feedback.

This change does not generate photorealistic assets or fabricate performance measurements. Imported artist-authored URP models and meshes are still required.

## Actual Unity tests still necessary

- Install properly licensed imported physical target prefabs; verify mesh, collider, Animator, LODGroup, and URP material hierarchy.
- Destroy each target and inspect the hierarchy: all production children and colliders should disappear together for the configured respawn delay, then reappear; the actor anchor must remain active.
- Repeat at near/mid/far camera distances to catch LOD switching, reset a running trial during target downtime, and check damage/scoring against original authored target colliders.
- Test Android/iOS/Windows actual frame time, texture memory, thermal stability and correct rig/material appearance. These are not validated by source-only GitHub CI.
