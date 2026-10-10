# TFM Bulk 53 — Real Production Art Integration

**Status:** Source integration code committed. Actual realistic FBX/model assets and Unity Editor import/build QA are **not** included in this Git-only bulk.

## Replacement contract

- Import properly licensed/original realistic characters, training-ground meshes and practice-target prefabs into your actual Unity 6 URP project.
- Each prefab must have visible meshes. Environment and practice-target prefabs must also provide real colliders aligned to their model geometry.
- Create a **TFM/Production Art Profile** asset with **Assets > Create > TFM > Production Art Profile**. Assign operator, environment and target assets. Keep exactly one profile in the project.
- Open **TFM > Open Training Yard**, then choose **TFM > Production Art > Apply Imported Prefabs**.
- The editor tool checks references before changing the scene, instantiates prefab assets as children of existing gameplay anchors, hides original primitive visuals/colliders, and marks the scene dirty. It does **not** overwrite/squash authored scenes or automatically save them.
- Practice-target MonoBehaviours remain on existing anchors so hit detection, target motion and scoring continue to work; the production-target prefab must include colliders. The player keeps its original CharacterController, input and weapon components.
- Use **TFM > Production Art > Validate Open Scene** to check references. This is not proof of rig, skinning, animation quality, collision shape, URP shader compatibility, frame pacing or mobile device suitability.

## Art authoring / acceptance criteria

Create an original, realistic military operator with humanoid rig, suitable Animator controller and clips. Create a full physical training environment that matches original gameplay-scale anchor positions (30 m footprint, spawn near z=-7 m and target locations around x=-4/0/4, z=-1 m), with grounded lighting, LODs and colliders. Practice targets are non-character physical range targets. Production prefabs may have any internally authored mesh/renderer hierarchy; the editor places one instance under each anchor.

In the Unity Editor: visually inspect orientation, camera occlusion, material render pipeline, physical collision, hit detection, target respawn, and all authored animated states. Profile on Android, iOS and Windows hardware; stable frame pacing and thermal constraints take precedence over maximal polygon count.

**No game binaries, licensed art models, shader graphs or measured FPS were produced by this change.**
