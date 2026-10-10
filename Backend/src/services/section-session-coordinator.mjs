export class SectionSessionCoordinator {
  constructor({ maps, multiplayer, battleRoyale, coop, extraction }) {
    this.maps = maps;
    this.multiplayer = multiplayer;
    this.battleRoyale = battleRoyale;
    this.coop = coop;
    this.extraction = extraction;
  }

  create(input) {
    const section = String(input?.section || "").trim();
    const mapId = String(input?.mapId || "").trim();

    if (!this.maps.supports(mapId, section))
      return { ok: false, error: "map_not_valid_for_section" };

    if (section === "multiplayer") {
      const runtime = this.multiplayer.create({
        matchId: input?.matchId,
        modeId: input?.modeId || "team-deathmatch",
        mapId,
      });
      return {
        ok: true,
        session: {
          section,
          mapId,
          runtimeId: runtime.runtime.matchId,
          runtimeType: "multiplayer",
        },
      };
    }

    if (section === "battle-royale") {
      const runtime = this.battleRoyale.create({
        matchId: input?.matchId,
        connectedPlayers: input?.connectedPlayers,
        activeTeams: input?.activeTeams,
      });
      return {
        ok: true,
        session: {
          section,
          mapId,
          runtimeId: runtime.runtime.matchId,
          runtimeType: "battle-royale",
        },
      };
    }

    if (section === "zombies") {
      const runtime = this.coop.create({
        sessionId: input?.matchId,
        variant: input?.variant || "survival",
        participants: input?.participants,
        remainingObjectives: input?.remainingObjectives,
      });
      return {
        ok: true,
        session: {
          section,
          mapId,
          runtimeId: runtime.runtime.sessionId,
          runtimeType: "cooperative",
        },
      };
    }

    if (section === "dmz-recon") {
      const runtime = this.extraction.create({
        matchId: input?.matchId,
        squadSize: input?.squadSize,
        durationSeconds: input?.durationSeconds,
      });
      return {
        ok: true,
        session: {
          section,
          mapId,
          runtimeId: runtime.runtime.matchId,
          runtimeType: "extraction",
        },
      };
    }

    return { ok: false, error: "unknown_section" };
  }
}
