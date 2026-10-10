import test from "node:test";
import assert from "node:assert/strict";
import { PatchReleaseService } from "../src/services/patch-release.mjs";
import { patchReleaseRuntime } from "../src/patch-release-contracts.mjs";

test("patch is staged and does not reach clients before rollout", () => {
  const service = new PatchReleaseService(patchReleaseRuntime);
  const created = service.create({
    platform: "android",
    channel: "stable",
    version: "1.1.0",
    minimumSupportedBuild: 100,
    targetBuild: 110,
    integrityTag: "sha256:example",
    packageIds: ["core:1.1.0"],
  });
  assert.equal(created.ok, true);
  assert.equal(service.publish(created.patch.patchId).ok, true);

  assert.equal(service.resolve({
    platform: "android",
    channel: "stable",
    currentBuild: 100,
    rolloutBucket: 0,
  }).decision.decision, "current");

  service.setRollout(created.patch.patchId, 10);
  assert.equal(service.resolve({
    platform: "android",
    channel: "stable",
    currentBuild: 100,
    rolloutBucket: 5,
  }).decision.decision, "update-available");

  assert.equal(service.resolve({
    platform: "android",
    channel: "stable",
    currentBuild: 100,
    rolloutBucket: 50,
  }).decision.decision, "current");
});

test("minimum supported build makes an update mandatory", () => {
  const service = new PatchReleaseService(patchReleaseRuntime);
  const created = service.create({
    platform: "windows",
    channel: "stable",
    version: "2.0.0",
    minimumSupportedBuild: 200,
    targetBuild: 220,
    integrityTag: "sha256:example2",
    packageIds: ["core:2.0.0"],
  });
  service.publish(created.patch.patchId);
  service.setRollout(created.patch.patchId, 100);

  const decision = service.resolve({
    platform: "windows",
    channel: "stable",
    currentBuild: 180,
    rolloutBucket: 20,
  });
  assert.equal(decision.decision.decision, "update-required");
  assert.equal(decision.decision.required, true);
});

test("published patch can roll back to an earlier published patch", () => {
  const service = new PatchReleaseService(patchReleaseRuntime);
  const first = service.create({
    platform: "ios",
    channel: "stable",
    version: "1.0.0",
    targetBuild: 10,
    integrityTag: "sha256:first",
    packageIds: ["core:1"],
  });
  service.publish(first.patch.patchId);
  service.setRollout(first.patch.patchId, 100);

  const second = service.create({
    platform: "ios",
    channel: "stable",
    version: "1.1.0",
    targetBuild: 11,
    integrityTag: "sha256:second",
    packageIds: ["core:1.1"],
    previousPatchId: first.patch.patchId,
  });
  service.publish(second.patch.patchId);
  service.setRollout(second.patch.patchId, 100);

  const rollback = service.rollback(second.patch.patchId, "crash-rate");
  assert.equal(rollback.ok, true);
  assert.equal(rollback.restoredPatch.patchId, first.patch.patchId);
  assert.equal(rollback.restoredPatch.rolloutPercent, 100);
});

test("runtime contract keeps app-store and package signing outside starter", () => {
  assert.match(patchReleaseRuntime.productionBoundary, /does not host binaries/i);
  assert.match(patchReleaseRuntime.productionBoundary, /app-store review/i);
});
