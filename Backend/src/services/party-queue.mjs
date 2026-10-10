export class PartyQueueCoordinator {
  constructor({ parties, queues }) {
    this.parties = parties;
    this.queues = queues;
  }

  enqueue(input) {
    const partyId = String(input?.partyId || "").trim();
    const modeId = String(input?.modeId || "").trim();
    const region = String(input?.region || "").trim();

    const party = this.parties.get(partyId);
    const composition = this.parties.composition(partyId);
    if (!party || !composition) return { ok: false, error: "party_not_found" };
    if (!composition.allReady) return { ok: false, error: "party_not_ready" };
    if (!modeId || !region) return { ok: false, error: "invalid_party_queue_request" };

    const result = this.queues.join({
      playerId: party.leaderPlayerId,
      modeId,
      region,
      partySize: composition.size,
      skillRating: composition.averageSkillRating,
    });

    if (!result.ok) return result;
    return {
      ok: true,
      queue: {
        ...result.entry,
        partyId,
        memberPlayerIds: party.members.map(member => member.playerId),
        ranked: Boolean(input?.ranked),
      },
    };
  }
}
