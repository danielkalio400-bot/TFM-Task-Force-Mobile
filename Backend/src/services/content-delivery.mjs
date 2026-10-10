export class ContentDeliveryService {
  #packages = new Map();

  constructor(contentPackCatalog) {
    this.contentPackCatalog = contentPackCatalog;
  }

  publish(input) {
    const packId = String(input?.packId || "").trim();
    const version = String(input?.version || "").trim();
    const integrityTag = String(input?.integrityTag || "").trim();
    const pack = this.contentPackCatalog.packs.find(entry => entry.id === packId);

    if (!pack) return { ok: false, error: "content_pack_not_found" };
    if (!version || !integrityTag) return { ok: false, error: "invalid_delivery_package" };

    const packageId = `${packId}:${version}`;
    const state = {
      packageId,
      packId,
      version,
      sizeBytes: Math.max(0, Math.trunc(Number(input?.sizeBytes) || 0)),
      integrityTag: integrityTag.slice(0, 256),
      state: "available",
      downloadedBytes: 0,
      publishedAt: new Date().toISOString(),
    };
    this.#packages.set(packageId, state);
    return { ok: true, package: { ...state } };
  }

  update(packageId, input) {
    const state = this.#packages.get(packageId);
    if (!state) return { ok: false, error: "delivery_package_not_found" };

    const allowed = new Set(["available", "queued", "downloading", "verifying", "ready", "failed"]);
    const nextState = String(input?.state || state.state);
    if (!allowed.has(nextState)) return { ok: false, error: "invalid_delivery_state" };

    state.state = nextState;
    state.downloadedBytes = Math.max(0, Math.trunc(Number(input?.downloadedBytes ?? state.downloadedBytes) || 0));
    if (state.sizeBytes > 0) state.downloadedBytes = Math.min(state.downloadedBytes, state.sizeBytes);
    return { ok: true, package: { ...state } };
  }

  list(packId = "") {
    return [...this.#packages.values()]
      .filter(item => !packId || item.packId === packId)
      .map(item => ({ ...item }));
  }
}
