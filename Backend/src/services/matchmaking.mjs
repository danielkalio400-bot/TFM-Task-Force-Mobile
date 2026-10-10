import { randomUUID } from "node:crypto";

const VALID_PLATFORMS = new Set(["android", "ios", "windows"]);

function cleanString(value, min, max) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  if (result.length < min || result.length > max) return null;
  return result;
}

export class MatchmakingService {
  #sections;
  #tickets = new Map();
  #matches = new Map();

  constructor(sectionIds) {
    this.#sections = new Set(sectionIds);
  }

  createTicket(input) {
    const playerId = cleanString(input?.playerId, 1, 128);
    const sectionId = cleanString(input?.sectionId, 1, 24);
    const playlist = cleanString(input?.playlist, 1, 64);
    const platform = cleanString(input?.platform, 1, 24);
    const region = cleanString(input?.region, 2, 24);

    if (!playerId || !sectionId || !playlist || !platform || !region) {
      return { ok: false, error: "invalid_ticket" };
    }
    if (!this.#sections.has(sectionId)) {
      return { ok: false, error: "unknown_section" };
    }
    if (!VALID_PLATFORMS.has(platform)) {
      return { ok: false, error: "unsupported_platform" };
    }

    const existing = [...this.#tickets.values()].find(
      ticket => ticket.playerId === playerId && ticket.status === "searching",
    );
    if (existing) {
      return { ok: false, error: "player_already_searching" };
    }

    const ticket = {
      ticketId: randomUUID(),
      playerId,
      sectionId,
      playlist,
      platform,
      region,
      status: "searching",
      matchId: "",
      createdAt: new Date().toISOString(),
    };
    this.#tickets.set(ticket.ticketId, ticket);
    this.#tryMatch(ticket);
    return { ok: true, ticket: { ...ticket } };
  }

  getTicket(ticketId) {
    const ticket = this.#tickets.get(ticketId);
    return ticket ? { ...ticket } : null;
  }

  cancelTicket(ticketId) {
    const ticket = this.#tickets.get(ticketId);
    if (!ticket) return null;
    if (ticket.status === "searching") {
      ticket.status = "cancelled";
    }
    return { ...ticket };
  }

  getMatch(matchId) {
    const match = this.#matches.get(matchId);
    return match
      ? { ...match, playerIds: [...match.playerIds] }
      : null;
  }

  stats() {
    const tickets = [...this.#tickets.values()];
    return {
      tickets: tickets.length,
      searching: tickets.filter(ticket => ticket.status === "searching").length,
      matched: tickets.filter(ticket => ticket.status === "matched").length,
      matches: this.#matches.size,
    };
  }

  #tryMatch(candidate) {
    const partner = [...this.#tickets.values()].find(ticket =>
      ticket.ticketId !== candidate.ticketId &&
      ticket.status === "searching" &&
      ticket.sectionId === candidate.sectionId &&
      ticket.playlist === candidate.playlist &&
      ticket.region === candidate.region
    );

    if (!partner) return;

    const matchId = randomUUID();
    const match = {
      matchId,
      sectionId: candidate.sectionId,
      playlist: candidate.playlist,
      region: candidate.region,
      playerIds: [partner.playerId, candidate.playerId],
      platforms: [partner.platform, candidate.platform],
      state: "ready",
      createdAt: new Date().toISOString(),
    };

    partner.status = "matched";
    partner.matchId = matchId;
    candidate.status = "matched";
    candidate.matchId = matchId;
    this.#matches.set(matchId, match);
  }
}
