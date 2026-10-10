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
import { handleLiveServices } from "./routes/live-services.mjs";
import { MatchmakingService } from "./services/matchmaking.mjs";
import { LobbyService } from "./services/lobbies.mjs";
import { AllocationService } from "./services/allocations.mjs";
import { ProfileService } from "./services/profiles.mjs";
import { RecoveryService } from "./services/recovery.mjs";
import { GameSessionService } from "./services/sessions.mjs";
import { InventoryLedger } from "./services/inventory-ledger.mjs";
import { MatchResultService } from "./services/match-results.mjs";
import { ModerationService } from "./services/moderation.mjs";
import { PrivateMatchService } from "./services/private-matches.mjs";
import { RankedService } from "./services/ranked.mjs";
import { handleCompetitive } from "./routes/competitive.mjs";
import { handleOperations } from "./routes/operations.mjs";
import { ServerRegistry } from "./services/server-registry.mjs";
import { ServerAssignmentService } from "./services/server-assignments.mjs";
import { MapVoteService } from "./services/map-votes.mjs";
import { PerformanceTelemetryService } from "./services/performance-telemetry.mjs";
import { handleSessionOperations } from "./routes/session-operations.mjs";
import { RegionalQueueService } from "./services/regional-queues.mjs";
import { MatchSessionService } from "./services/match-sessions.mjs";
import { ServerDrainService } from "./services/server-draining.mjs";
import { IncidentService } from "./services/incidents.mjs";
import { FairPlayService } from "./services/fairplay.mjs";
import { handleGameplayServices } from "./routes/gameplay-services.mjs";
import { PartyService } from "./services/parties.mjs";
import { RewardService } from "./services/rewards.mjs";
import { ReconnectRestoreService } from "./services/reconnect-restores.mjs";
import { OperationsHealthService } from "./services/operations-health.mjs";

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
  const sessions = new GameSessionService();
  const inventory = new InventoryLedger();
  const matchResults = new MatchResultService();
  const moderation = new ModerationService();
  const privateMatches = new PrivateMatchService();
  const ranked = new RankedService();
  const servers = new ServerRegistry();
  const assignmentsV2 = new ServerAssignmentService(servers);
  const mapVotes = new MapVoteService();
  const performanceTelemetry = new PerformanceTelemetryService();
  const regionalQueues = new RegionalQueueService();
  const matchSessions = new MatchSessionService();
  const serverDrains = new ServerDrainService();
  const incidents = new IncidentService();
  const fairPlay = new FairPlayService();
  const parties = new PartyService();
  const rewards = new RewardService();
  const reconnectRestores = new ReconnectRestoreService();
  const operationsHealth = new OperationsHealthService({ servers, incidents });

  matchResults.trustLocalServer("local-dev-server");

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
        identity: "dev-validated-subject-placeholder",
        bazidOidc: "not-connected",
        multiplayerTransport: "not-implemented",
        matchmaking: "local-in-memory-prototype",
        lobbies: "local-in-memory-prototype",
        progression: "local-in-memory-prototype",
        inventoryAuthority: "local-development-ledger",
        moderation: "local-report-intake",
        matchResults: "trusted-local-server-prototype",
        sessionRecovery: "local-in-memory-prototype",
        privateMatches: "local-in-memory-prototype",
        ranked: "local-in-memory-prototype",
        serverAllocation: "local-registry-prototype",
        serverHealth: "local-heartbeat-prototype",
        mapVoting: "local-in-memory-prototype",
        performanceTelemetry: "local-aggregate-prototype",
        regionalQueues: "local-in-memory-prototype",
        matchSessionFlow: "local-in-memory-prototype",
        serverDraining: "local-in-memory-prototype",
        fairPlayReview: "local-signal-intake",
        parties: "local-in-memory-prototype",
        rewardGrants: "local-idempotent-prototype",
        reconnectRestoration: "local-single-use-prototype",
        operationsHealth: "local-aggregate-prototype",
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
    if (await handleLiveServices(request, response, path, {
      sessions, inventory, matchResults, moderation
    })) return;
    if (await handleCompetitive(request, response, path, { privateMatches, ranked })) return;
    if (await handleOperations(request, response, path, {
      servers,
      assignments: assignmentsV2,
      mapVotes,
      telemetry: performanceTelemetry,
    })) return;
    if (await handleSessionOperations(request, response, path, {
      queues: regionalQueues,
      sessions: matchSessions,
      drains: serverDrains,
      incidents,
      fairPlay,
    })) return;
    if (await handleGameplayServices(request, response, path, {
      parties,
      rewards,
      restores: reconnectRestores,
      health: operationsHealth,
    })) return;

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
