export class ContentInstallationService {
  #states = new Map();

  constructor(catalog) {
    this.catalog = catalog;
  }

  catalogView() {
    return {
      version: this.catalog.version,
      packs: this.catalog.packs.map(pack => ({
        ...pack,
        state: this.get(pack.id),
      })),
      note: this.catalog.note,
    };
  }

  get(packId) {
    if (!this.#states.has(packId)) {
      this.#states.set(packId, {
        packId,
        installedVersion: "",
        state: "not-installed",
        downloadedBytes: 0,
        totalBytes: 0,
        failureCode: "",
      });
    }
    return { ...this.#states.get(packId) };
  }

  update(packId, input) {
    const pack = this.catalog.packs.find(entry => entry.id === packId);
    if (!pack) return { ok: false, error: "content_pack_not_found" };

    const state = this.get(packId);
    const allowed = new Set([
      "not-installed",
      "queued",
      "downloading",
      "verifying",
      "installed",
      "failed",
      "update-required",
    ]);
    const nextState = String(input?.state || state.state);
    if (!allowed.has(nextState)) return { ok: false, error: "invalid_content_state" };

    const next = {
      ...state,
      state: nextState,
      installedVersion: String(input?.installedVersion ?? state.installedVersion).slice(0, 64),
      downloadedBytes: Math.max(0, Math.trunc(Number(input?.downloadedBytes ?? state.downloadedBytes) || 0)),
      totalBytes: Math.max(0, Math.trunc(Number(input?.totalBytes ?? state.totalBytes) || 0)),
      failureCode: String(input?.failureCode ?? state.failureCode).slice(0, 128),
    };
    if (next.totalBytes > 0) next.downloadedBytes = Math.min(next.downloadedBytes, next.totalBytes);
    this.#states.set(packId, next);
    return { ok: true, state: { ...next } };
  }
}
