export class SectionLaunchService {
  constructor({ compatibility, mapReadiness, lifecycles, sectionSessions }) {
    this.compatibility = compatibility;
    this.mapReadiness = mapReadiness;
    this.lifecycles = lifecycles;
    this.sectionSessions = sectionSessions;
  }

  launch(input) {
    const sectionId = String(input?.sectionId || "").trim();
    const modeId = String(input?.modeId || "").trim();
    const mapId = String(input?.mapId || "").trim();
    const region = String(input?.region || "west-africa").trim();

    if (!sectionId || !modeId || !mapId)
      return { ok: false, error: "invalid_section_launch" };

    const lifecycleResult = this.lifecycles.create({ sectionId, modeId, mapId });
    if (!lifecycleResult.ok) return lifecycleResult;
    const lifecycleId = lifecycleResult.lifecycle.lifecycleId;

    this.lifecycles.move(lifecycleId, "checking-content");
    const compatibility = this.compatibility.evaluate({
      sectionId,
      clientVersion: input?.clientVersion || "dev",
      manifestVersion: input?.manifestVersion || 1,
    });
    if (!compatibility.ok || compatibility.report.state !== "compatible") {
      this.lifecycles.move(lifecycleId, "failed", compatibility.error || compatibility.report.state);
      return {
        ok: false,
        error: "content_not_ready",
        lifecycleId,
        compatibility: compatibility.report || null,
      };
    }

    this.lifecycles.move(lifecycleId, "checking-map");
    const readiness = this.mapReadiness.get(mapId);
    if (!readiness) {
      this.lifecycles.move(lifecycleId, "failed", "map_not_found");
      return { ok: false, error: "map_not_found", lifecycleId };
    }

    const described = this.mapReadiness.describe(readiness);
    if (!described.prototypeReady) {
      this.lifecycles.move(lifecycleId, "failed", "map_not_playable");
      return { ok: false, error: "map_not_playable", lifecycleId, readiness: described };
    }

    this.lifecycles.move(lifecycleId, "creating-session");
    const session = this.sectionSessions.create({
      section: sectionId,
      modeId,
      mapId,
      region,
      connectedPlayers: input?.playerCount,
      participants: input?.playerCount,
      squadSize: input?.playerCount,
    });

    if (!session.ok) {
      this.lifecycles.move(lifecycleId, "failed", session.error);
      return { ok: false, error: session.error, lifecycleId };
    }

    this.lifecycles.move(lifecycleId, "allocating-server");
    return {
      ok: true,
      lifecycleId,
      runtimeId: session.session.runtimeId,
      session: session.session,
      region,
    };
  }
}
