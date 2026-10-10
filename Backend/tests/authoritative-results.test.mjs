import test from "node:test";
import assert from "node:assert/strict";
import { AuthoritativeMatchArchiveService } from "../src/services/authoritative-match-archive.mjs";
import { ReplayTelemetryArchiveService } from "../src/services/replay-telemetry-archive.mjs";
import { AuthoritativeResultPipelineService } from "../src/services/authoritative-result-pipeline.mjs";
import { ProgressionAuthorityService } from "../src/services/progression-authority.mjs";
import { ProgressionAuditService } from "../src/services/progression-audit.mjs";
import { ProgressionUnlockService } from "../src/services/progression-unlocks.mjs";
import { ProgressionLeaderboardService } from "../src/services/progression-leaderboard.mjs";
import { ProfileService } from "../src/services/profiles.mjs";
import { progressionAuthorityRuntime } from "../src/progression-authority-contracts.mjs";
import { authoritativeMatchRecordsRuntime } from "../src/match-authority-contracts.mjs";

function makeProgression() {
  return new ProgressionAuthorityService({
    profiles: new ProfileService(),
    audit: new ProgressionAuditService(),
    unlocks: new ProgressionUnlockService(progressionAuthorityRuntime.unlockRules),
    leaderboard: new ProgressionLeaderboardService(),
    contract: progressionAuthorityRuntime,
  });
}

test("authoritative result requires trusted server and validated proof reference", () => {
  const archive = new AuthoritativeMatchArchiveService({ trustedServers: ["server-1"] });
  const base = {
    matchId: "match-1",
    serverId: "server-1",
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
    startedAt: new Date(Date.now() - 60000).toISOString(),
    completedAt: new Date().toISOString(),
    players: [{ playerId: "p1", score: 10 }],
  };

  assert.equal(archive.ingest(base).error, "match_proof_not_validated");
  assert.equal(archive.ingest({
    ...base,
    validationProofId: "proof-1",
    proofValidated: true,
  }).ok, true);
});

test("replay telemetry enforces monotonic sequence and seal", () => {
  const replay = new ReplayTelemetryArchiveService();
  assert.equal(replay.append({
    matchId: "m1",
    sequence: 1,
    eventType: "spawn",
    matchTimeMilliseconds: 0,
  }).ok, true);
  assert.equal(replay.append({
    matchId: "m1",
    sequence: 3,
    eventType: "objective",
    matchTimeMilliseconds: 1000,
  }).error, "replay_sequence_gap");
  assert.equal(replay.append({
    matchId: "m1",
    sequence: 2,
    eventType: "objective",
    matchTimeMilliseconds: 1000,
  }).ok, true);
  assert.equal(replay.seal("m1").manifest.complete, true);
  assert.equal(replay.append({
    matchId: "m1",
    sequence: 3,
    eventType: "objective",
  }).error, "replay_telemetry_sealed");
});

test("authoritative pipeline archives result and grants progression idempotently", () => {
  const archive = new AuthoritativeMatchArchiveService({ trustedServers: ["server-1"] });
  const replay = new ReplayTelemetryArchiveService();
  replay.append({ matchId: "match-2", sequence: 1, eventType: "match-start" });
  replay.seal("match-2");

  const pipeline = new AuthoritativeResultPipelineService({
    archive,
    replay,
    progression: makeProgression(),
  });

  const result = pipeline.process({
    matchId: "match-2",
    serverId: "server-1",
    sectionId: "multiplayer",
    modeId: "team-score",
    mapId: "harborline",
    winningTeamId: "a",
    validationProofId: "proof-2",
    proofValidated: true,
    startedAt: new Date(Date.now() - 60000).toISOString(),
    completedAt: new Date().toISOString(),
    players: [
      { playerId: "p1", teamId: "a", score: 50, assists: 2 },
      { playerId: "p2", teamId: "b", score: 40, assists: 1 },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.replayManifest.complete, true);
  assert.equal(result.progression.length, 2);
});

test("runtime contract keeps real cryptographic verification outside starter", () => {
  assert.match(authoritativeMatchRecordsRuntime.productionBoundary, /Real signing/i);
});
