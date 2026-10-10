# TFM Bulk 56 — Imported Target Respawn and PBR Material Integrity

**Code shipped:** Production practice targets no longer reactivate hidden primitive **Body** and **Head** geometry when their health resets after a hit. \`TFMTargetDummy.Awake\` snapshots only previously enabled, active renderers and physical, non-trigger colliders; death/respawn toggles only this captured set. The production art installer keeps original gameplay anchors intact and provides imported physical targets under them.

Targets configured with the **TFM Production Practice Target** instance now preserve artist-authored PBR materials and textures on hits and respawn. The combat HUD's hit marker still reports hit confirmation. The original primitive practice-target training coloration remains unchanged for unconverted scenes.

**Unity QA required:** With imported realistic target prefabs and operator installed, start a drill, hit each target until it disappears, verify collision and geometry both disappear during the respawn timer, verify only the imported physical model returns, and check that its PBR shader and material textures are unchanged. Repeat training reset while targets are down, and check dynamic moving targets. Review optional LODGroup renderer switching by eye in Unity; source tests do not certify LOD state.

**Limitations:** No FBX models, production environment meshes, texture assets, Unity Editor builds, APKs, iOS exports or performance measurements were produced. CI validates source contracts only.
