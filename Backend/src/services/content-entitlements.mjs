export class ContentEntitlementService {
  #records = new Map();

  constructor(contentPackCatalog) {
    this.contentPackCatalog = contentPackCatalog;
  }

  grant(input) {
    const playerId = String(input?.playerId || "").trim();
    const packId = String(input?.packId || "").trim();
    if (!playerId || !this.contentPackCatalog.packs.some(pack => pack.id === packId))
      return { ok: false, error: "invalid_entitlement" };

    const record = {
      playerId,
      packId,
      state: "granted",
      grantedAt: new Date().toISOString(),
      expiresAt: input?.expiresAt ? String(input.expiresAt) : null,
    };
    this.#records.set(`${playerId}:${packId}`, record);
    return { ok: true, entitlement: { ...record } };
  }

  setState(playerId, packId, state) {
    const key = `${playerId}:${packId}`;
    const record = this.#records.get(key);
    if (!record) return { ok: false, error: "entitlement_not_found" };

    const allowed = new Set(["granted", "not-granted", "suspended", "expired"]);
    if (!allowed.has(state)) return { ok: false, error: "invalid_entitlement_state" };

    record.state = state;
    return { ok: true, entitlement: { ...record } };
  }

  check(playerId, packId) {
    const record = this.#records.get(`${playerId}:${packId}`);
    if (!record) return { granted: false, reason: "not-granted" };
    if (record.state !== "granted") return { granted: false, reason: record.state };
    if (record.expiresAt && Date.parse(record.expiresAt) <= Date.now())
      return { granted: false, reason: "expired" };
    return { granted: true, entitlement: { ...record } };
  }

  checkSection(playerId, packIds) {
    const missing = [];
    for (const packId of packIds || []) {
      const result = this.check(playerId, packId);
      if (!result.granted) missing.push({ packId, reason: result.reason });
    }
    return { granted: missing.length === 0, missing };
  }
}
