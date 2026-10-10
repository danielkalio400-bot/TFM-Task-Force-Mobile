export class MatchResultService {
  #results = new Map();
  #trustedServers = new Set();

  trustLocalServer(serverId) {
    if (typeof serverId === "string" && serverId.trim())
      this.#trustedServers.add(serverId.trim());
  }

  ingest(input) {
    if (!input || typeof input.matchId !== "string" || !input.matchId.trim())
      return { ok: false, error: "invalid_match_result" };

    if (!this.#trustedServers.has(input.serverId))
      return { ok: false, error: "untrusted_server" };

    if (this.#results.has(input.matchId))
      return { ok: false, error: "duplicate_match_result" };

    if (!Array.isArray(input.players) || input.players.length === 0)
      return { ok: false, error: "missing_players" };

    const completed = Date.parse(input.completedAt);
    const started = Date.parse(input.startedAt);
    if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started)
      return { ok: false, error: "invalid_match_time" };

    const normalized = {
      matchId: input.matchId.trim(),
      serverId: input.serverId,
      modeId: String(input.modeId || ""),
      winningTeamId: String(input.winningTeamId || ""),
      startedAt: new Date(started).toISOString(),
      completedAt: new Date(completed).toISOString(),
      players: input.players.map(player => ({
        playerId: String(player.playerId || ""),
        teamId: String(player.teamId || ""),
        score: Math.max(0, Number(player.score) || 0),
        eliminations: Math.max(0, Number(player.eliminations) || 0),
        assists: Math.max(0, Number(player.assists) || 0),
        experienceGranted: Math.max(0, Number(player.experienceGranted) || 0),
      })),
    };

    this.#results.set(normalized.matchId, normalized);
    return { ok: true, result: structuredClone(normalized) };
  }

  get(matchId) {
    const result = this.#results.get(matchId);
    return result ? structuredClone(result) : null;
  }
}
