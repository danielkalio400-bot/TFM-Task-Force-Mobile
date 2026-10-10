import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { sendJson } from "./http/json.mjs";
import { handleMatchmaking } from "./routes/matchmaking.mjs";
import { MatchmakingService } from "./services/matchmaking.mjs";

const modeCatalog = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/mode-catalog.json", import.meta.url), "utf8"),
);
const platformTargets = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/platform-targets.json", import.meta.url), "utf8"),
);

export function makeServer() {
  const sectionIds = modeCatalog.sections.map(section => section.id);
  const matchmaking = new MatchmakingService(sectionIds);

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
        committedPlatforms: platformTargets.committedTargets.map(item => item.id),
      });
    }

    if (request.method === "GET" && path === "/v1/modes") {
      return sendJson(response, 200, modeCatalog);
    }

    if (request.method === "GET" && path === "/v1/platforms") {
      return sendJson(response, 200, platformTargets);
    }

    if (await handleMatchmaking(request, response, path, matchmaking)) {
      return;
    }

    return sendJson(response, 404, { error: "not_found" });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number.parseInt(process.env.PORT || "4100", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid PORT");
  }

  makeServer().listen(port, "127.0.0.1", () => {
    console.log(`TFM starter API: http://127.0.0.1:${port}`);
  });
}
