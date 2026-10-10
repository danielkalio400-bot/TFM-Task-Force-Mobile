import test from "node:test";
import assert from "node:assert/strict";
import { BuildProvenanceService } from "../src/services/build-provenance.mjs";
import { buildProvenanceRuntime } from "../src/build-provenance-contracts.mjs";

test("artifact cannot verify without all provenance references", () => {
  const service = new BuildProvenanceService(buildProvenanceRuntime);
  const created = service.register({
    platform: "android",
    version: "1.0.0",
    buildNumber: 100,
    sourceCommit: "abcdef1",
  });
  assert.equal(created.ok, true);

  const result = service.verify(created.artifact.artifactId);
  assert.equal(result.ok, true);
  assert.equal(result.verification.passed, false);
  assert.ok(result.verification.blockingReasons.includes("missing:unityVersion"));
});

test("verified artifact can be promoted to release candidate", () => {
  const service = new BuildProvenanceService(buildProvenanceRuntime);
  const created = service.register({
    platform: "windows",
    version: "1.0.0",
    buildNumber: 10,
    sourceCommit: "abcdef1234567",
    unityVersion: "6000.x",
    artifactIntegrityReference: "sha256:artifact",
    signingIdentityReference: "signing-profile:windows-production",
    contentManifestReference: "content-manifest:1",
  });

  assert.equal(service.verify(created.artifact.artifactId).verification.passed, true);
  assert.equal(service.promote(created.artifact.artifactId).artifact.state, "release-candidate");
});

test("revoked artifact cannot verify", () => {
  const service = new BuildProvenanceService(buildProvenanceRuntime);
  const created = service.register({
    platform: "ios",
    version: "1.0.0",
    buildNumber: 10,
    sourceCommit: "abcdef1234567",
    unityVersion: "6000.x",
    artifactIntegrityReference: "sha256:artifact",
    signingIdentityReference: "signing-profile:ios-production",
    contentManifestReference: "content-manifest:1",
  });
  service.revoke(created.artifact.artifactId, "security-review");
  assert.equal(service.verify(created.artifact.artifactId).error, "build_artifact_revoked");
});

test("contract forbids storing signing keys", () => {
  assert.match(buildProvenanceRuntime.productionBoundary, /does not sign binaries/i);
  assert.match(buildProvenanceRuntime.productionBoundary, /private signing keys/i);
});
