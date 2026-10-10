import { randomUUID } from "node:crypto";

function clean(value, max = 160) {
  const result = String(value || "").trim();
  return result && result.length <= max ? result : "";
}

export class PatchReleaseService {
  #patches = new Map();
  #audit = [];

  constructor(contract) {
    this.platforms = new Set(contract?.platforms || []);
    this.channels = new Set(contract?.channels || []);
  }

  create(input) {
    const platform = clean(input?.platform, 32);
    const channel = clean(input?.channel, 32);
    const version = clean(input?.version, 64);
    const integrityTag = clean(input?.integrityTag, 256);
    const minimumSupportedBuild = Math.max(0, Math.trunc(Number(input?.minimumSupportedBuild) || 0));
    const targetBuild = Math.max(1, Math.trunc(Number(input?.targetBuild) || 0));
    const packageIds = Array.isArray(input?.packageIds)
      ? [...new Set(input.packageIds.map(value => clean(value, 160)).filter(Boolean))]
      : [];

    if (!this.platforms.has(platform) || !this.channels.has(channel) || !version ||
        !integrityTag || targetBuild < 1 || packageIds.length < 1)
      return { ok: false, error: "invalid_patch_manifest" };
    if (minimumSupportedBuild > targetBuild)
      return { ok: false, error: "minimum_build_exceeds_target" };

    const patch = {
      patchId: randomUUID(),
      platform,
      channel,
      version,
      minimumSupportedBuild,
      targetBuild,
      integrityTag,
      previousPatchId: clean(input?.previousPatchId, 120),
      required: Boolean(input?.required),
      rolloutPercent: 0,
      state: "draft",
      packageIds,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    };

    if (patch.previousPatchId && !this.#patches.has(patch.previousPatchId))
      return { ok: false, error: "previous_patch_not_found" };

    this.#patches.set(patch.patchId, patch);
    this.#record("patch-created", patch.patchId, { platform, channel, targetBuild });
    return { ok: true, patch: structuredClone(patch) };
  }

  publish(patchId) {
    const patch = this.#patches.get(String(patchId || ""));
    if (!patch) return { ok: false, error: "patch_not_found" };
    if (patch.state !== "draft") return { ok: false, error: "patch_not_draft" };

    patch.state = "published";
    patch.publishedAt = new Date().toISOString();
    patch.updatedAt = patch.publishedAt;
    this.#record("patch-published", patch.patchId, { platform: patch.platform, channel: patch.channel });
    return { ok: true, patch: structuredClone(patch) };
  }

  setRollout(patchId, rolloutPercent) {
    const patch = this.#patches.get(String(patchId || ""));
    if (!patch) return { ok: false, error: "patch_not_found" };
    if (patch.state !== "published") return { ok: false, error: "patch_not_published" };

    const percent = Math.trunc(Number(rolloutPercent));
    if (!Number.isFinite(percent) || percent < 0 || percent > 100)
      return { ok: false, error: "invalid_rollout_percent" };

    patch.rolloutPercent = percent;
    patch.updatedAt = new Date().toISOString();
    this.#record("patch-rollout-updated", patch.patchId, { rolloutPercent: percent });
    return { ok: true, patch: structuredClone(patch) };
  }

  rollback(patchId, reasonCode = "release-health-gate") {
    const patch = this.#patches.get(String(patchId || ""));
    if (!patch) return { ok: false, error: "patch_not_found" };
    if (patch.state !== "published") return { ok: false, error: "patch_not_published" };
    if (!patch.previousPatchId)
      return { ok: false, error: "patch_has_no_previous_revision" };

    const previous = this.#patches.get(patch.previousPatchId);
    if (!previous) return { ok: false, error: "previous_patch_not_found" };

    patch.state = "rolled-back";
    patch.rolloutPercent = 0;
    patch.updatedAt = new Date().toISOString();

    if (previous.state === "published")
      previous.rolloutPercent = 100;

    const rollback = {
      rollbackId: randomUUID(),
      patchId: patch.patchId,
      restoredPatchId: previous.patchId,
      reasonCode: clean(reasonCode, 100) || "release-health-gate",
      recordedAt: new Date().toISOString(),
    };
    this.#record("patch-rolled-back", patch.patchId, rollback);
    return { ok: true, rollback, patch: structuredClone(patch), restoredPatch: structuredClone(previous) };
  }

  resolve(input) {
    const platform = clean(input?.platform, 32);
    const channel = clean(input?.channel, 32);
    const currentBuild = Math.max(0, Math.trunc(Number(input?.currentBuild) || 0));
    const rolloutBucket = Math.max(0, Math.min(99, Math.trunc(Number(input?.rolloutBucket) || 0)));

    if (!this.platforms.has(platform) || !this.channels.has(channel))
      return { ok: false, error: "invalid_patch_client" };

    const candidates = [...this.#patches.values()]
      .filter(patch =>
        patch.platform === platform &&
        patch.channel === channel &&
        patch.state === "published" &&
        patch.rolloutPercent > rolloutBucket
      )
      .sort((a, b) => b.targetBuild - a.targetBuild || b.createdAt.localeCompare(a.createdAt));

    const patch = candidates[0];
    if (!patch || currentBuild >= patch.targetBuild) {
      return {
        ok: true,
        decision: {
          platform,
          channel,
          currentBuild,
          decision: "current",
          patchId: "",
          targetBuild: currentBuild,
          required: false,
        },
      };
    }

    const required = patch.required || currentBuild < patch.minimumSupportedBuild;
    return {
      ok: true,
      decision: {
        platform,
        channel,
        currentBuild,
        decision: required ? "update-required" : "update-available",
        patchId: patch.patchId,
        targetBuild: patch.targetBuild,
        required,
        packageIds: [...patch.packageIds],
        integrityTag: patch.integrityTag,
      },
    };
  }

  get(patchId) {
    const patch = this.#patches.get(String(patchId || ""));
    return patch ? structuredClone(patch) : null;
  }

  audit(limit = 100) {
    const count = Math.min(500, Math.max(1, Math.trunc(Number(limit) || 100)));
    return this.#audit.slice(-count).map(event => structuredClone(event));
  }

  #record(type, patchId, details) {
    this.#audit.push({
      eventId: randomUUID(),
      type,
      patchId,
      details: { ...details },
      recordedAt: new Date().toISOString(),
    });
    if (this.#audit.length > 5000) this.#audit.shift();
  }
}
