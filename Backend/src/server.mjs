import { createServer } from "node:http";
import { ServerObjectiveRoundsService } from "./services/server-objective-rounds.mjs";
import { ObjectiveReconnectBridge } from "./services/objective-reconnect-bridge.mjs";
import { ObjectiveLiveGateway } from "./services/objective-live-gateway.mjs";
import { ObjectiveIdentityGate } from "./services/objective-identity-gate.mjs";
import { ObjectiveSessionIssuer } from "./services/objective-session-issuer.mjs";
import { handleObjectiveSessionIssuer } from "./routes/objective-session-issuer.mjs";
import { objectiveSessionContract } from "./objective-session-contracts.mjs";
import { handleObjectiveLiveStream } from "./routes/objective-live-stream.mjs";
import { objectiveLiveContract } from "./objective-live-contracts.mjs";
import { handleServerObjectiveRounds } from "./routes/server-objective-rounds.mjs";
import { serverObjectiveRoundsContract } from "./server-objective-contracts.mjs";
import { objectiveReconnectContract } from "./objective-reconnect-contracts.mjs";
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
import { handleRuntimeOrchestration } from "./routes/runtime-orchestration.mjs";
import { ModeRuntimeService } from "./services/mode-runtime.mjs";
import { PartyQueueCoordinator } from "./services/party-queue.mjs";
import { ResultPipelineService } from "./services/result-pipeline.mjs";
import { LiveOperationsService } from "./services/live-operations.mjs";
import { handleSectionRuntimes } from "./routes/section-runtimes.mjs";
import { homeSections } from "./section-contracts.mjs";
import { BattleRoyaleRuntimeService } from "./services/br-runtime.mjs";
import { CoopRuntimeService } from "./services/coop-runtime.mjs";
import { ExtractionRuntimeService } from "./services/extraction-runtime.mjs";
import { handleContentSession } from "./routes/content-session.mjs";
import { originalMapCatalog, contentPackCatalog } from "./content-contracts.mjs";
import { MapCatalogService } from "./services/map-catalog.mjs";
import { ContentInstallationService } from "./services/content-installation.mjs";
import { SectionRecoveryService } from "./services/section-recovery.mjs";
import { SectionSessionCoordinator } from "./services/section-session-coordinator.mjs";
import { handleReadiness } from "./routes/readiness.mjs";
import { contentCompatibility, mapReadinessContract } from "./readiness-contracts.mjs";
import { ContentCompatibilityService } from "./services/content-compatibility.mjs";
import { MapReadinessService } from "./services/map-readiness.mjs";
import { SessionPersistenceService } from "./services/session-persistence.mjs";
import { SectionLifecycleService } from "./services/section-lifecycle.mjs";
import { handleDeliveryReadiness } from "./routes/delivery-readiness.mjs";
import { contentDeliveryContract, releaseReadinessContract } from "./delivery-contracts.mjs";
import { ContentDeliveryService } from "./services/content-delivery.mjs";
import { SectionLaunchService } from "./services/section-launch.mjs";
import { ReleaseReadinessService } from "./services/release-readiness.mjs";
import { handleProductionSession } from "./routes/production-session.mjs";
import { productionTelemetryGates } from "./production-contracts.mjs";
import { ContentEntitlementService } from "./services/content-entitlements.mjs";
import { DedicatedSessionCoordinator } from "./services/dedicated-session-coordinator.mjs";
import { AuthoritativeRecoveryService } from "./services/authoritative-recovery.mjs";
import { TelemetryGateService } from "./services/telemetry-gates.mjs";
import { handleIdentity } from "./routes/identity.mjs";
import { bazIdAuthBoundary } from "./identity-contracts.mjs";
import { IdentityAuditService } from "./services/identity-audit.mjs";
import { IdentityBoundaryService } from "./services/identity-boundary.mjs";
import { DataDeletionRequestService } from "./services/data-deletion-requests.mjs";
import { handleSocial } from "./routes/social.mjs";
import { socialPrivacyRuntime } from "./social-contracts.mjs";
import { FriendsService } from "./services/friends.mjs";
import { PrivacyService } from "./services/privacy.mjs";
import { ClanService } from "./services/clans.mjs";
import { SocialPolicyService } from "./services/social-policy.mjs";
import { handleSocialSafety } from "./routes/social-safety.mjs";
import { socialSafetyRuntime } from "./social-safety-contracts.mjs";
import { ActionRateLimitService } from "./services/action-rate-limits.mjs";
import { ModerationSanctionService } from "./services/moderation-sanctions.mjs";
import { ConsentSettingsService } from "./services/consent-settings.mjs";
import { NotificationPreferenceService } from "./services/notification-preferences.mjs";
import { SocialSafetyPolicyService } from "./services/social-safety-policy.mjs";
import { handleProgressionAuthority } from "./routes/progression-authority.mjs";
import { progressionAuthorityRuntime } from "./progression-authority-contracts.mjs";
import { ProgressionAuditService } from "./services/progression-audit.mjs";
import { ProgressionUnlockService } from "./services/progression-unlocks.mjs";
import { ProgressionLeaderboardService } from "./services/progression-leaderboard.mjs";
import { ProgressionAuthorityService } from "./services/progression-authority.mjs";
import { handleAuthoritativeResults } from "./routes/authoritative-results.mjs";
import { authoritativeMatchRecordsRuntime } from "./match-authority-contracts.mjs";
import { AuthoritativeMatchArchiveService } from "./services/authoritative-match-archive.mjs";
import { ReplayTelemetryArchiveService } from "./services/replay-telemetry-archive.mjs";
import { AuthoritativeResultPipelineService } from "./services/authoritative-result-pipeline.mjs";
import { handleMatchmakingAuthority } from "./routes/matchmaking-authority.mjs";
import { matchmakingAuthorityRuntime } from "./matchmaking-authority-contracts.mjs";
import { FairMatchmakingPolicyService } from "./services/fair-matchmaking-policy.mjs";
import { MatchmakingAuthorityService } from "./services/matchmaking-authority.mjs";
import { handleProfileAuthority } from "./routes/profile-authority.mjs";
import { playerProfileAuthorityRuntime } from "./profile-authority-contracts.mjs";
import { PlayerProfileAuthorityService } from "./services/player-profile-authority.mjs";
import { handleInventoryAuthority } from "./routes/inventory-authority.mjs";
import { inventoryAuthorityRuntime } from "./inventory-authority-contracts.mjs";
import { InventoryAuthorityService } from "./services/inventory-authority.mjs";
import { handleOperationsReliability } from "./routes/operations-reliability.mjs";
import { operationsReliabilityRuntime } from "./operations-reliability-contracts.mjs";
import { OperationsReliabilityService } from "./services/operations-reliability.mjs";
import { handlePatchRelease } from "./routes/patch-release.mjs";
import { patchReleaseRuntime } from "./patch-release-contracts.mjs";
import { PatchReleaseService } from "./services/patch-release.mjs";
import { handlePlatformCompliance } from "./routes/platform-compliance.mjs";
import { platformComplianceRuntime } from "./platform-compliance-contracts.mjs";
import { PlatformComplianceService } from "./services/platform-compliance.mjs";
import { handleProductGovernance } from "./routes/product-governance.mjs";
import { productGovernanceRuntime } from "./product-governance-contracts.mjs";
import { ProductGovernanceService } from "./services/product-governance.mjs";
import { handleBuildProvenance } from "./routes/build-provenance.mjs";
import { buildProvenanceRuntime } from "./build-provenance-contracts.mjs";
import { BuildProvenanceService } from "./services/build-provenance.mjs";
import { handleReleaseObservability } from "./routes/release-observability.mjs";
import { releaseObservabilityRuntime } from "./release-observability-contracts.mjs";
import { ReleaseObservabilityService } from "./services/release-observability.mjs";

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
  const modeRuntime = new ModeRuntimeService();
  const serverObjectiveRounds = new ServerObjectiveRoundsService({
    trustedServerIds: ["local-dev-server"]
  });
  const partyQueue = new PartyQueueCoordinator({ parties, queues: regionalQueues });
  const resultPipeline = new ResultPipelineService({ matchResults, rewards, profiles });
  const liveOperations = new LiveOperationsService();
  const battleRoyaleRuntime = new BattleRoyaleRuntimeService();
  const coopRuntime = new CoopRuntimeService();
  const extractionRuntime = new ExtractionRuntimeService();
  const mapCatalog = new MapCatalogService(originalMapCatalog);
  const contentInstallation = new ContentInstallationService(contentPackCatalog);
  const sectionRecovery = new SectionRecoveryService();
  const compatibility = new ContentCompatibilityService({ installation: contentInstallation, contract: contentCompatibility });
  const mapReadiness = new MapReadinessService(mapCatalog);
  const sessionPersistence = new SessionPersistenceService();
  const sectionLifecycles = new SectionLifecycleService();
  const contentDelivery = new ContentDeliveryService(contentPackCatalog);
  const releaseReadiness = new ReleaseReadinessService();
  const entitlements = new ContentEntitlementService(contentPackCatalog);
  const telemetryGates = new TelemetryGateService(productionTelemetryGates);
  const identityAudit = new IdentityAuditService();
  const identityBoundary = new IdentityBoundaryService({ sessions, audit: identityAudit });
  const deletionRequests = new DataDeletionRequestService();
  const friends = new FriendsService();
  const privacy = new PrivacyService();
  const clans = new ClanService();
  const socialPolicy = new SocialPolicyService({ friends, clans, privacy });
  const socialRateLimits = new ActionRateLimitService(socialSafetyRuntime.defaultRateLimits);
  const moderationSanctions = new ModerationSanctionService();
  const consentSettings = new ConsentSettingsService();
  const notificationPreferences = new NotificationPreferenceService();
  const progressionAudit = new ProgressionAuditService();
  const progressionUnlocks = new ProgressionUnlockService(progressionAuthorityRuntime.unlockRules);
  const progressionLeaderboard = new ProgressionLeaderboardService();
  const progressionAuthority = new ProgressionAuthorityService({
    profiles,
    audit: progressionAudit,
    unlocks: progressionUnlocks,
    leaderboard: progressionLeaderboard,
    contract: progressionAuthorityRuntime,
  });
  const authoritativeMatchArchive = new AuthoritativeMatchArchiveService({ trustedServers: ["local-dev-server"] });
  const replayTelemetryArchive = new ReplayTelemetryArchiveService();
  const authoritativeResultPipeline = new AuthoritativeResultPipelineService({
    archive: authoritativeMatchArchive,
    replay: replayTelemetryArchive,
    progression: progressionAuthority,
  });
  const fairMatchmakingPolicy = new FairMatchmakingPolicyService(matchmakingAuthorityRuntime);
  const matchmakingAuthority = new MatchmakingAuthorityService({
    policy: fairMatchmakingPolicy,
    contract: matchmakingAuthorityRuntime,
  });
  const playerProfileAuthority = new PlayerProfileAuthorityService();
  const inventoryAuthority = new InventoryAuthorityService({ ledger: inventory, contract: inventoryAuthorityRuntime });
  const operationsReliability = new OperationsReliabilityService({
    health: operationsHealth,
    incidents,
    liveOperations,
    contract: operationsReliabilityRuntime,
  });
  const patchRelease = new PatchReleaseService(patchReleaseRuntime);
  const platformCompliance = new PlatformComplianceService(platformComplianceRuntime);
  const productGovernance = new ProductGovernanceService(productGovernanceRuntime);
  const buildProvenance = new BuildProvenanceService(buildProvenanceRuntime);
  const releaseObservability = new ReleaseObservabilityService(releaseObservabilityRuntime);
  const socialSafetyPolicy = new SocialSafetyPolicyService({
    sanctions: moderationSanctions,
    consent: consentSettings,
    rateLimits: socialRateLimits,
  });
  const sectionSessions = new SectionSessionCoordinator({
    maps: mapCatalog,
    multiplayer: modeRuntime,
    battleRoyale: battleRoyaleRuntime,
    coop: coopRuntime,
    extraction: extractionRuntime,
  });

  const sectionLaunch = new SectionLaunchService({
    compatibility,
    mapReadiness,
    lifecycles: sectionLifecycles,
    sectionSessions,
  });
  const dedicatedSessions = new DedicatedSessionCoordinator({
    liveOperations,
    assignments: assignmentsV2,
    lifecycles: sectionLifecycles,
    persistence: sessionPersistence,
  });
  const authoritativeRecovery = new AuthoritativeRecoveryService(sessionPersistence);
  const objectiveIdentityGate = new ObjectiveIdentityGate();
  const objectiveReconnectBridge = new ObjectiveReconnectBridge({
    rounds: serverObjectiveRounds, assignments: assignmentsV2,
    persistence: sessionPersistence,
    authorizeSubject: (principal, playerId) =>
      objectiveIdentityGate.authorize(principal, playerId)
  });
  const objectiveLiveGateway = new ObjectiveLiveGateway({
    bridge: objectiveReconnectBridge, rounds: serverObjectiveRounds
  });
  const objectiveSessionIssuer = new ObjectiveSessionIssuer({
    identity: objectiveIdentityGate, gateway: objectiveLiveGateway
  });

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
        objectiveReconnect: "in-process-bridge-not-networked",
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
        modeRuntime: "local-in-memory-prototype",
        partyQueue: "local-composition-prototype",
        resultPipeline: "trusted-local-server-prototype",
        liveOperations: "local-regional-state-prototype",
        battleRoyaleRuntime: "local-in-memory-prototype",
        cooperativeRuntime: "local-in-memory-prototype",
        extractionRuntime: "local-in-memory-prototype",
        contentPacks: "metadata-state-prototype",
        originalMapCatalog: "concept-metadata-only",
        sectionRecovery: "local-single-use-prototype",
        contentCompatibility: "local-gate-prototype",
        mapReadiness: "local-validation-metadata",
        sessionPersistence: "local-sequenced-snapshots",
        sectionLifecycle: "local-state-machine-prototype",
        contentDelivery: "local-package-metadata-prototype",
        sectionLaunch: "local-gated-orchestration-prototype",
        releaseReadiness: "local-gate-evaluation",
        contentEntitlements: "local-player-pack-prototype",
        dedicatedSessionAllocation: "local-authoritative-orchestration-prototype",
        authoritativeRecovery: "local-snapshot-bound-prototype",
        productionTelemetryGates: "development-threshold-evaluation",
        identityBoundary: "external-provider-development-boundary",
        identityAudit: "local-audit-prototype",
        dataDeletionRequests: "local-workflow-prototype",
        socialGraph: "local-privacy-aware-prototype",
        clans: "local-role-based-prototype",
        socialPrivacy: "local-policy-prototype",
        socialSafety: "local-consent-rate-limit-prototype",
        moderationSanctions: "local-policy-state-prototype",
        progressionAuthority: "local-trusted-source-prototype",
        progressionAudit: "local-audit-history-prototype",
        progressionLeaderboard: "local-snapshot-prototype",
        authoritativeMatchArchive: "local-validated-proof-prototype",
        replayTelemetryArchive: "local-sequenced-metadata-prototype",
        matchmakingAuthority: "local-time-bounded-fair-policy-prototype",
        playerProfileAuthority: "local-stable-id-subject-reference-prototype",
        inventoryAuthorityV2: "local-server-owned-transaction-prototype",
        operationsReliability: "local-health-rollback-load-gate-prototype",
        patchRelease: "local-staged-release-metadata-prototype",
        platformCompliance: "local-internal-certification-gate-prototype",
        productGovernance: "local-risk-and-maturity-gate-prototype",
        buildProvenance: "local-artifact-traceability-prototype",
        releaseObservability: "local-release-quality-gate-prototype",
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
    if (await handleRuntimeOrchestration(request, response, path, {
      modeRuntime,
      partyQueue,
      resultPipeline,
      liveOperations,
    })) return;
    if (await handleSectionRuntimes(request, response, path, {
      sections: homeSections,
      battleRoyale: battleRoyaleRuntime,
      coop: coopRuntime,
      extraction: extractionRuntime,
    })) return;
    if (await handleContentSession(request, response, path, {
      maps: mapCatalog,
      content: contentInstallation,
      sectionSessions,
      recovery: sectionRecovery,
    })) return;
    if (await handleReadiness(request, response, path, {
      compatibility,
      mapReadiness,
      persistence: sessionPersistence,
      lifecycles: sectionLifecycles,
      contracts: {
        compatibility: contentCompatibility,
        mapReadiness: mapReadinessContract,
      },
    })) return;
    if (await handleDeliveryReadiness(request, response, path, {
      delivery: contentDelivery,
      launch: sectionLaunch,
      release: releaseReadiness,
      contracts: {
        delivery: contentDeliveryContract,
        release: releaseReadinessContract,
      },
    })) return;
    if (await handleProductionSession(request, response, path, {
      entitlements,
      contentCompatibility,
      dedicatedSessions,
      recovery: authoritativeRecovery,
      telemetry: telemetryGates,
      contracts: { telemetry: productionTelemetryGates },
    })) return;
    if (await handleIdentity(request, response, path, {
      identity: identityBoundary,
      audit: identityAudit,
      deletions: deletionRequests,
      contract: bazIdAuthBoundary,
    })) return;
    if (await handleSocial(request, response, path, {
      friends,
      privacy,
      clans,
      policy: socialPolicy,
      contract: socialPrivacyRuntime,
    })) return;
    if (await handleSocialSafety(request, response, path, {
      sanctions: moderationSanctions,
      consent: consentSettings,
      notifications: notificationPreferences,
      policy: socialSafetyPolicy,
      contract: socialSafetyRuntime,
    })) return;
    if (await handleProgressionAuthority(request, response, path, {
      authority: progressionAuthority,
      audit: progressionAudit,
      unlocks: progressionUnlocks,
      leaderboard: progressionLeaderboard,
      contract: progressionAuthorityRuntime,
    })) return;
    if (await handleAuthoritativeResults(request, response, path, {
      archive: authoritativeMatchArchive,
      replay: replayTelemetryArchive,
      pipeline: authoritativeResultPipeline,
      contract: authoritativeMatchRecordsRuntime,
    })) return;
    if (await handleMatchmakingAuthority(request, response, path, {
      matchmaking: matchmakingAuthority,
      policy: fairMatchmakingPolicy,
      contract: matchmakingAuthorityRuntime,
    })) return;
    if (await handleProfileAuthority(request, response, path, {
      profiles: playerProfileAuthority,
      contract: playerProfileAuthorityRuntime,
    })) return;
    if (await handleInventoryAuthority(request, response, path, {
      authority: inventoryAuthority,
      sessions,
      contract: inventoryAuthorityRuntime,
    })) return;
    if (await handleOperationsReliability(request, response, path, {
      reliability: operationsReliability,
      contract: operationsReliabilityRuntime,
    })) return;
    if (await handlePatchRelease(request, response, path, {
      patches: patchRelease,
      contract: patchReleaseRuntime,
    })) return;
    if (await handlePlatformCompliance(request, response, path, {
      compliance: platformCompliance,
      contract: platformComplianceRuntime,
    })) return;
    if (await handleProductGovernance(request, response, path, {
      governance: productGovernance,
      contract: productGovernanceRuntime,
    })) return;
    if (await handleBuildProvenance(request, response, path, {
      builds: buildProvenance,
      contract: buildProvenanceRuntime,
    })) return;
    if (await handleReleaseObservability(request, response, path, {
      quality: releaseObservability,
      contract: releaseObservabilityRuntime,
    })) return;
    if (await handleServerObjectiveRounds(request, response, path, {
      rounds: serverObjectiveRounds,
      contract: serverObjectiveRoundsContract,
    })) return;
    if (request.method === "GET" && path === "/v1/runtime/objective-reconnect-bridge")
      return sendJson(response, 200, objectiveReconnectContract);
    if (await handleObjectiveLiveStream(request, response, path, {
      gateway: objectiveLiveGateway, contract: objectiveLiveContract,
    })) return;
    if (await handleObjectiveSessionIssuer(request, response, path, {
      issuer: objectiveSessionIssuer, contract: objectiveSessionContract,
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
