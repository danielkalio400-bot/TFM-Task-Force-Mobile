import { randomUUID } from "node:crypto";

function clean(value, max = 128) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result && result.length <= max ? result : null;
}

export class PartyService {
  #parties = new Map();

  create(input) {
    const playerId = clean(input?.playerId);
    const platform = clean(input?.platform, 24);
    const maximumMembers = Math.min(16, Math.max(1, Number(input?.maximumMembers) || 4));
    if (!playerId || !["android", "ios", "windows"].includes(platform))
      return { ok: false, error: "invalid_party" };

    const party = {
      partyId: randomUUID(),
      leaderPlayerId: playerId,
      maximumMembers,
      members: [{
        playerId,
        platform,
        role: "leader",
        skillRating: Math.max(0, Number(input?.skillRating) || 0),
        ready: false,
      }],
      createdAt: new Date().toISOString(),
    };

    this.#parties.set(party.partyId, party);
    return { ok: true, party: structuredClone(party) };
  }

  get(partyId) {
    const party = this.#parties.get(partyId);
    return party ? structuredClone(party) : null;
  }

  join(partyId, input) {
    const party = this.#parties.get(partyId);
    if (!party) return { ok: false, error: "party_not_found" };

    const playerId = clean(input?.playerId);
    const platform = clean(input?.platform, 24);
    if (!playerId || !["android", "ios", "windows"].includes(platform))
      return { ok: false, error: "invalid_party_member" };

    if (party.members.some(member => member.playerId === playerId))
      return { ok: true, party: structuredClone(party) };
    if (party.members.length >= party.maximumMembers)
      return { ok: false, error: "party_full" };

    party.members.push({
      playerId,
      platform,
      role: "member",
      skillRating: Math.max(0, Number(input?.skillRating) || 0),
      ready: false,
    });
    return { ok: true, party: structuredClone(party) };
  }

  setReady(partyId, playerId, ready) {
    const party = this.#parties.get(partyId);
    if (!party) return { ok: false, error: "party_not_found" };
    const member = party.members.find(entry => entry.playerId === playerId);
    if (!member) return { ok: false, error: "party_member_not_found" };
    member.ready = Boolean(ready);
    return { ok: true, party: structuredClone(party) };
  }

  composition(partyId) {
    const party = this.#parties.get(partyId);
    if (!party) return null;
    const ratings = party.members.map(member => member.skillRating);
    const averageSkillRating = ratings.length
      ? Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
      : 0;

    return {
      partyId: party.partyId,
      size: party.members.length,
      averageSkillRating,
      allReady: party.members.length > 0 && party.members.every(member => member.ready),
      platforms: [...new Set(party.members.map(member => member.platform))],
    };
  }
}
