import { randomUUID } from "node:crypto";

export class MapVoteService {
  #votes = new Map();

  create({ matchId, modeId, options, durationSeconds = 20 }) {
    if (typeof matchId !== "string" || !matchId.trim() ||
        typeof modeId !== "string" || !modeId.trim() ||
        !Array.isArray(options)) {
      return { ok: false, error: "invalid_map_vote" };
    }

    const unique = [...new Set(options.map(value => String(value || "").trim()).filter(Boolean))].slice(0, 5);
    if (unique.length < 2) return { ok: false, error: "insufficient_map_options" };

    const vote = {
      voteId: randomUUID(),
      matchId: matchId.trim(),
      modeId: modeId.trim(),
      options: unique.map(mapId => ({ mapId, votes: 0 })),
      voters: new Set(),
      closesAt: new Date(Date.now() + Math.max(5, durationSeconds) * 1000).toISOString(),
      selectedMapId: "",
    };

    this.#votes.set(vote.voteId, vote);
    return { ok: true, vote: this.#public(vote) };
  }

  cast(voteId, playerId, mapId) {
    const vote = this.#votes.get(voteId);
    if (!vote) return { ok: false, error: "map_vote_not_found" };
    if (Date.parse(vote.closesAt) <= Date.now()) return { ok: false, error: "map_vote_closed" };
    if (vote.voters.has(playerId)) return { ok: false, error: "player_already_voted" };

    const option = vote.options.find(item => item.mapId === mapId);
    if (!option) return { ok: false, error: "invalid_map_option" };

    option.votes++;
    vote.voters.add(playerId);
    return { ok: true, vote: this.#public(vote) };
  }

  finalize(voteId) {
    const vote = this.#votes.get(voteId);
    if (!vote) return { ok: false, error: "map_vote_not_found" };

    const winner = [...vote.options].sort((a, b) => b.votes - a.votes || a.mapId.localeCompare(b.mapId))[0];
    vote.selectedMapId = winner?.mapId || "";
    return { ok: true, vote: this.#public(vote) };
  }

  get(voteId) {
    const vote = this.#votes.get(voteId);
    return vote ? this.#public(vote) : null;
  }

  #public(vote) {
    return {
      voteId: vote.voteId,
      matchId: vote.matchId,
      modeId: vote.modeId,
      options: vote.options.map(option => ({ ...option })),
      closesAt: vote.closesAt,
      selectedMapId: vote.selectedMapId,
    };
  }
}
