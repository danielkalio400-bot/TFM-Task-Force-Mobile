# Unity platform guidelines

## Shared foundation
- Use Unity 6 LTS + Universal 3D / URP template from Unity Hub.
- Keep one shared gameplay codebase wherever practical.
- Start with 1 original environment and 1 menu scene, not 30 empty scenes.
- Establish measured CPU, GPU, memory, network and frame-time budgets.
- Optimized server state and low latency are separate from rendering FPS.
- Obtain rights for every character, environment, sound and visual asset.

## Android / iOS
- Touch HUD with scalable safe areas and control layout.
- Optional gyro aiming.
- Stable 30 FPS fallback and higher frame-rate modes only where the device can sustain them.
- Dynamic resolution, LODs, efficient materials, selective shadows and platform texture compression.
- Measure thermals, battery consumption, RAM pressure and frame pacing on real devices.

## Windows PC
- Keyboard/mouse and controller support.
- Adaptive HUD/input prompts.
- Wider graphics range, higher texture tiers, longer draw distance and stronger effects where hardware allows.
- Support high-refresh displays only when validated with stable frame pacing.
- Profile CPU/GPU scaling across minimum, recommended and high-end PC targets.

## Cross-platform QA
- Gameplay rules must remain equivalent across platforms.
- Do not give one platform hidden competitive advantages through different simulation rules.
- Test networking, aim/input latency, UI scaling, aspect ratios and accessibility separately on each target.
