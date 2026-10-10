import { randomUUID } from "node:crypto";

export class AuthoritativeMatchArchiveService {
  #records = new Map();

  constructor({ trustedServers = [] } = {}) {
    this.trustedServers = new Set(trustedServers);
  }

  trustServer(serverId) {
    const id = String(serverId || "").trim();
    if (id) this.trustedServers.add(id);
  }

  ingest(input) {
    const matchId = String(input?.matchId || "").trim();
    const serverId = String(input?.serverId || "").trim();
    const sectionId = String(input?.sectionId || "").trim();
    const modeId = String(input?.modeId || "").trim();
    const mapId = String(input?.mapId || "").trim();
    const validationProofId = String(input?.validationProofId || "").trim();

    if (!matchId || !serverId || !sectionId || !modeId || !mapId)
      return { ok: false, error: "invalid_authoritative_match_record" };
    if (!this.trustedServers.has(serverId))
      return { ok: false, error: "untrusted_match_server" };
    if (!validationProofId || input?.proofValidated !== true)
      return { ok: false, error: "match_proof_not_validated" };
    if (this.#records.has(matchId))
      return { ok: false, error: "authoritative_match_already_archived" };

    const started = Date.parse(String(input?.startedAt || ""));
    const completed = Date.parse(String(input?.completedAt || ""));
    if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started)
      return { ok: false, error: "invalid_match_time" };
    if (!Array.isArray(input?.players) || input.players.length === 0)
      return { ok: false, error: "missing_match_players" };

    const record = {
      archiveId: randomUUID(),
      matchId,
      serverId,
      sectionId,
      modeId,
      mapId,
      winningTeamId: String(input?.winningTeamId || "").trim(),
      validationProofId: validationProofId.slice(0, 160),
      validationState: "validated",
      startedAt: new Date(started).toISOString(),
      completedAt: new Date(completed).toISOString(),
      players: input.players.map(player => ({
        playerId: String(player?.playerId || "").trim(),
        teamId: String(player?.teamId || "").trim(),
        score: Math.max(0, Math.trunc(Number(player?.score) || 0)),
        eliminations: Math.max(0, Math.trunc(Number(player?.eliminations) || 0)),
        assists: Math.max(0, Math.trunc(Number(player?.assists) || 0)),
      })),
      archivedAt: new Date().toISOString(),
    };

    if (record.players.some(player => !player.playerId))
      return { ok: false, error: "invalid_match_player" };

    this.#records.set(matchId, record);
    return { ok: true, record: structuredClone(record) };
  }

  get(matchId) {
    const record = this.#records.get(String(matchId || ""));
    return record ? structuredClone(record) : null;
  }
}
