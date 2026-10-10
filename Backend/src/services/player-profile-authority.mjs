import { randomUUID } from "node:crypto";

function clean(value, max = 128) {
  const result = String(value || "").trim();
  return result && result.length <= max ? result : "";
}

export class PlayerProfileAuthorityService {
  #byPlayer = new Map();
  #subjectToPlayer = new Map();
  #audit = [];

  linkExternalSubject(input) {
    const subjectReference = clean(input?.subjectReference, 256);
    const displayName = clean(input?.displayName, 32);
    const provider = clean(input?.provider || "BazID", 32);
    if (!subjectReference || !provider)
      return { ok: false, error: "invalid_profile_identity_reference" };

    const subjectKey = provider + ":" + subjectReference;
    const existingPlayerId = this.#subjectToPlayer.get(subjectKey);
    if (existingPlayerId) {
      const existing = this.#byPlayer.get(existingPlayerId);
      if (displayName && displayName !== existing.displayName) {
        existing.displayName = displayName;
        existing.updatedAt = new Date().toISOString();
        this.#record(existing.playerId, "display-name-updated");
      }
      return { ok: true, created: false, profile: { ...existing } };
    }

    const now = new Date().toISOString();
    const profile = {
      playerId: randomUUID(),
      displayName,
      identityProvider: provider,
      subjectReference,
      lifecycleState: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.#byPlayer.set(profile.playerId, profile);
    this.#subjectToPlayer.set(subjectKey, profile.playerId);
    this.#record(profile.playerId, "profile-created");
    return { ok: true, created: true, profile: { ...profile } };
  }

  get(playerId) {
    const profile = this.#byPlayer.get(String(playerId || ""));
    return profile ? { ...profile } : null;
  }

  updateDisplayName(playerId, displayName) {
    const profile = this.#byPlayer.get(String(playerId || ""));
    const value = clean(displayName, 32);
    if (!profile) return { ok: false, error: "player_profile_not_found" };
    if (!value) return { ok: false, error: "invalid_display_name" };
    if (profile.lifecycleState !== "active")
      return { ok: false, error: "player_profile_not_active" };

    profile.displayName = value;
    profile.updatedAt = new Date().toISOString();
    this.#record(profile.playerId, "display-name-updated");
    return { ok: true, profile: { ...profile } };
  }

  setLifecycleState(playerId, state) {
    const profile = this.#byPlayer.get(String(playerId || ""));
    if (!profile) return { ok: false, error: "player_profile_not_found" };

    const allowed = new Set(["active", "disabled", "deletion-requested", "deleted"]);
    if (!allowed.has(state)) return { ok: false, error: "invalid_profile_lifecycle_state" };

    profile.lifecycleState = state;
    profile.updatedAt = new Date().toISOString();
    this.#record(profile.playerId, "lifecycle:" + state);
    return { ok: true, profile: { ...profile } };
  }

  audit(playerId, limit = 50) {
    const id = String(playerId || "").trim();
    const count = Math.min(200, Math.max(1, Math.trunc(Number(limit) || 50)));
    return this.#audit
      .filter(event => !id || event.playerId === id)
      .slice(-count)
      .map(event => ({ ...event }));
  }

  #record(playerId, action) {
    this.#audit.push({
      auditId: randomUUID(),
      playerId,
      action,
      recordedAt: new Date().toISOString(),
    });
    if (this.#audit.length > 5000) this.#audit.shift();
  }
}
