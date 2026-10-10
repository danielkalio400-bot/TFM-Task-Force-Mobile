export class ContentCompatibilityService {
  constructor({ installation, contract }) {
    this.installation = installation;
    this.contract = contract;
  }

  evaluate({ sectionId, clientVersion = "dev", manifestVersion = 1 }) {
    const required = this.contract.sectionPackIds[sectionId];
    if (!required) return { ok: false, error: "unknown_section" };

    if (Number(manifestVersion) > Number(this.contract.supportedManifestVersion)) {
      return {
        ok: true,
        report: {
          clientVersion,
          manifestVersion,
          state: "manifest-unsupported",
          missingOrOutdatedPackIds: [],
        },
      };
    }

    const missing = required.filter(packId => this.installation.get(packId).state !== "installed");
    return {
      ok: true,
      report: {
        clientVersion: String(clientVersion).slice(0, 64),
        manifestVersion: Number(manifestVersion) || 0,
        state: missing.length ? "content-update-required" : "compatible",
        missingOrOutdatedPackIds: missing,
      },
    };
  }
}
