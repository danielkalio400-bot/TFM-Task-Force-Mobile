# Phased delivery

0. Confirm scope, licenses, roles, platform targets and game safety requirements.
1. Unity Hub project + menu prototype + one original demonstration map.
2. Shared player controller, platform abstraction, mobile touch/gyro controls and Windows keyboard/mouse/controller.
3. Graphics profiling on real Android/iOS devices and representative Windows PC hardware.
4. Authenticated BazID integration and profile services.
5. Authoritative test multiplayer with reliable hosting and observability.
6. Ranked systems, scalable BR feasibility, capacity and reliability tests.
7. Zombies and extraction mission prototypes with separate persistence.
8. Android, iOS and Windows build pipelines, platform compliance, moderation, QA, security and live ops.
9. Content rollout toward 25+ modes/variants and 30+ original maps.

Each phase requires testing. Release gates are not bypassed automatically.

Current implementation: phase 1 has started with a runtime-generated 3D
training yard, third-person movement, camera collision, target-range combat and
mobile touch input. It still needs an Editor playtest, saved Unity scene, menu
and original art pass.
