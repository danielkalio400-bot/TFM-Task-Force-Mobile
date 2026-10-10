# Bulk 30 — Adaptive Unity client performance (Android / iOS / Windows)

The GitHub repository has already reached Bulk 29. This batch targets the actual Unity training vertical slice instead of recreating prior backend services.

## Runtime additions
- Refresh-divisor-aware FPS policy; 30 FPS minimum when hardware supports it, with no artificial 120/144 FPS maximum.
- Safe initial mobile 30 FPS and PC 60 FPS *targets*, followed by sustained-window upward probes.
- 120-frame sampling windows, slow-frame percentage and cooldown-based downshifts.
- Dynamic render-scale reduction before lowering target FPS, gradual restoration once stable.
- Four preferences: Battery Saver, Balanced, Performance and Adaptive.
- Per-install local preference storage; touch-friendly debug panel, F8 PC shortcut and display safe-area positioning.
- Existing saved Training Yard scenes receive performance components at Play without regeneration or replacement.
- Runtime quality telemetry is strictly client-owned and not an authoritative gameplay result.
- Node CI static source/contract checks added; those do **not** compile Unity C#.

## Verify in Unity 6
1. Create/open the genuine Universal 3D/URP project in Unity Hub.
2. Import the maintained TFM scripts and open **TFM > Open Training Yard**.
3. Press Play, open Graphics/FPS; on PC use F8. Confirm target and sampled FPS.
4. Test battery saver, balanced, performance and adaptive caps.
5. Profile frame pacing, resolution, thermals, touch target sizes, input, memory and battery on Android and iOS devices; test Windows separately.
6. Use **TFM > Validate Training Scene** and platform-specific Editor builds. The current GitHub CI is Node-only and is not a substitute for Unity compilation or hardware tests.

## Limits
This is a prototype settings/performance controller, not proof of stable 60/90/120+ FPS on any particular device. Frame pacing controls cannot guarantee rendering or network performance. Original maps, commercial art, audio, dedicated game servers, BazID production login and signed app builds remain separate delivery gates.
