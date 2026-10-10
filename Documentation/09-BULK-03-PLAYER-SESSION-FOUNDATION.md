# Bulk 03 - Player, match and session foundation

## Added
- Gamepad input support alongside keyboard/mouse and touch.
- Gyroscope aim bridge for supported mobile devices.
- Match rules and score tracking foundations.
- Respawn state/controller.
- Session lifecycle state machine.
- Lobby DTOs and shared schema.
- Server allocation DTO and shared schema.
- Local in-memory lobby service.
- Local placeholder server-allocation service.
- Backend tests for lobby and allocation behavior.

## Production boundary
These systems are development foundations. They do not claim production multiplayer. Lobby identity is still supplied by local prototype requests, server allocation does not expose a real game server, and there is no anti-cheat, ranking, party voice, production reconnect, secure game-session token or dedicated-server orchestrator yet.

The next online milestone must bind lobby/matchmaking requests to validated game sessions and authoritative servers.
