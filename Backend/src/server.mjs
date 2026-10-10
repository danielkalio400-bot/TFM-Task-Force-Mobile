import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { sendJson } from "./http/json.mjs";
import { handleMatchmaking } from "./routes/matchmaking.mjs";
import { handleLobbies } from "./routes/lobbies.mjs";
import { handleAllocations } from "./routes/allocations.mjs";
import { handleProfiles } from "./routes/profiles.mjs";
import { handleRecovery } from "./routes/recovery.mjs";
import { MatchmakingService } from "./services/matchmaking.mjs";
import { LobbyService } from "./services/lobbies.mjs";
import { AllocationService } from "./services/allocations.mjs";
import { ProfileService } from "./services/profiles.mjs";
import { RecoveryService } from "./services/recovery.mjs";

const modeCatalog = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/mode-catalog.json", import.meta.url), "utf8"),
);
const platformTargets = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/platform-targets.json", import.meta.url), "utf8"),
);

export function makeServer() {
  const sectionIds = modeCatalog.sections.map(section => section.id);
  const matchmaking = new MatchmakingService(sectionIds);
  const lobbies = new LobbyService();
  const allocations = new AllocationService();
  const profiles = new ProfileService();
  const recovery = new RecoveryService();

  return createServer(async (request, response) => {
    const path = (request.url || "").split("?")[0];

    if (request.method === "GET" && path === "/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "tfm-api-starter",
        productionReady: false,
      });
    }

    if (request.method === "GET" && path === "/v1/status") {
      return sendJson(response, 200, {
        service: "tfm-api-starter",
        productionReady: false,
        authentication: "not-implemented",
        multiplayerTransport: "not-implemented",
        matchmaking: "local-in-memory-prototype",
        lobbies: "local-in-memory-prototype",
        progression: "local-in-memory-prototype",
        sessionRecovery: "local-in-memory-prototype",
        serverAllocation: "placeholder-only",
        committedPlatforms: platformTargets.committedTargets.map(item => item.id),
      });
    }

    if (request.method === "GET" && path === "/v1/modes")
      return sendJson(response, 200, modeCatalog);

    if (request.method === "GET" && path === "/v1/platforms")
      return sendJson(response, 200, platformTargets);

    if (await handleLobbies(request, response, path, lobbies)) return;
    if (await handleMatchmaking(request, response, path, matchmaking)) return;
    if (await handleAllocations(request, response, path, allocations)) return;
    if (await handleProfiles(request, response, path, profiles)) return;
    if (await handleRecovery(request, response, path, recovery)) return;

    return sendJson(response, 404, { error: "not_found" });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number.parseInt(process.env.PORT || "4100", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid PORT");

  makeServer().listen(port, "127.0.0.1", () => {
    console.log(`TFM starter API: http://127.0.0.1:${port}`);
  });
}
