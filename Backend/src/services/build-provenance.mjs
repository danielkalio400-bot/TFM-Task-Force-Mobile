import { randomUUID } from "node:crypto";

function clean(value, max = 240) {
  const result = String(value || "").trim();
  return result && result.length <= max ? result : "";
}

export class BuildProvenanceService {
  #artifacts = new Map();
  #verifications = new Map();
  #audit = [];

  constructor(contract) {
    this.platforms = new Set(contract?.platforms || []);
    this.requiredFields = contract?.requiredFields || [];
  }

  register(input) {
    const platform = clean(input?.platform, 32);
    const version = clean(input?.version, 64);
    const buildNumber = Math.max(1, Math.trunc(Number(input?.buildNumber) || 0));
    if (!this.platforms.has(platform) || !version || buildNumber < 1)
      return { ok: false, error: "invalid_build_artifact" };

    const artifact = {
      artifactId: randomUUID(),
      platform,
      version,
      buildNumber,
      sourceCommit: clean(input?.sourceCommit, 80),
      unityVersion: clean(input?.unityVersion, 80),
      artifactIntegrityReference: clean(input?.artifactIntegrityReference, 240),
      signingIdentityReference: clean(input?.signingIdentityReference, 240),
      contentManifestReference: clean(input?.contentManifestReference, 240),
      state: "registered",
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.#artifacts.set(artifact.artifactId, artifact);
    this.#record("artifact-registered", {
      artifactId: artifact.artifactId,
      platform,
      version,
      buildNumber,
    });
    return { ok: true, artifact: { ...artifact } };
  }

  verify(artifactId) {
    const artifact = this.#artifacts.get(String(artifactId || ""));
    if (!artifact) return { ok: false, error: "build_artifact_not_found" };
    if (artifact.state === "revoked")
      return { ok: false, error: "build_artifact_revoked" };

    const blockingReasons = [];
    for (const field of this.requiredFields) {
      if (!artifact[field]) blockingReasons.push("missing:" + field);
    }

    if (artifact.sourceCommit && !/^[a-f0-9]{7,64}$/i.test(artifact.sourceCommit))
      blockingReasons.push("invalid:sourceCommit");

    const result = {
      verificationId: randomUUID(),
      artifactId: artifact.artifactId,
      passed: blockingReasons.length === 0,
      blockingReasons,
      verifiedAt: new Date().toISOString(),
    };
    this.#verifications.set(result.verificationId, result);

    if (result.passed) {
      artifact.state = "verified";
      artifact.updatedAt = result.verifiedAt;
    }

    this.#record("artifact-verified", {
      artifactId: artifact.artifactId,
      passed: result.passed,
      blockingCount: blockingReasons.length,
    });

    return { ok: true, verification: structuredClone(result), artifact: { ...artifact } };
  }

  promote(artifactId) {
    const artifact = this.#artifacts.get(String(artifactId || ""));
    if (!artifact) return { ok: false, error: "build_artifact_not_found" };
    if (artifact.state !== "verified")
      return { ok: false, error: "build_artifact_not_verified" };

    artifact.state = "release-candidate";
    artifact.updatedAt = new Date().toISOString();
    this.#record("artifact-promoted", {
      artifactId: artifact.artifactId,
      platform: artifact.platform,
      version: artifact.version,
    });
    return { ok: true, artifact: { ...artifact } };
  }

  revoke(artifactId, reasonCode = "internal-revocation") {
    const artifact = this.#artifacts.get(String(artifactId || ""));
    if (!artifact) return { ok: false, error: "build_artifact_not_found" };

    artifact.state = "revoked";
    artifact.updatedAt = new Date().toISOString();
    this.#record("artifact-revoked", {
      artifactId: artifact.artifactId,
      reasonCode: clean(reasonCode, 100) || "internal-revocation",
    });
    return { ok: true, artifact: { ...artifact } };
  }

  get(artifactId) {
    const artifact = this.#artifacts.get(String(artifactId || ""));
    return artifact ? { ...artifact } : null;
  }

  list(platform = "") {
    const filter = clean(platform, 32);
    return [...this.#artifacts.values()]
      .filter(artifact => !filter || artifact.platform === filter)
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .map(artifact => ({ ...artifact }));
  }

  audit(limit = 100) {
    const count = Math.min(500, Math.max(1, Math.trunc(Number(limit) || 100)));
    return this.#audit.slice(-count).map(event => structuredClone(event));
  }

  #record(type, details) {
    this.#audit.push({
      eventId: randomUUID(),
      type,
      details: { ...details },
      recordedAt: new Date().toISOString(),
    });
    if (this.#audit.length > 5000) this.#audit.shift();
  }
}
