import { randomUUID } from "node:crypto";

const ROLES = new Set(["member", "moderator", "officer", "owner"]);

export class ClanService {
  #clans = new Map();
  #memberToClan = new Map();

  create(input) {
    const ownerPlayerId = String(input?.ownerPlayerId || "").trim();
    const name = String(input?.name || "").trim().slice(0, 40);
    const tag = String(input?.tag || "").trim().slice(0, 8).toUpperCase();
    if (!ownerPlayerId || !name || !tag)
      return { ok: false, error: "invalid_clan" };
    if (this.#memberToClan.has(ownerPlayerId))
      return { ok: false, error: "player_already_in_clan" };

    const clan = {
      clanId: randomUUID(),
      name,
      tag,
      privacy: ["open", "request-to-join", "invite-only"].includes(input?.privacy)
        ? input.privacy
        : "request-to-join",
      memberLimit: Math.min(200, Math.max(2, Number(input?.memberLimit) || 50)),
      recruitmentEnabled: input?.recruitmentEnabled !== false,
      members: [{ playerId: ownerPlayerId, role: "owner", joinedAt: new Date().toISOString() }],
    };
    this.#clans.set(clan.clanId, clan);
    this.#memberToClan.set(ownerPlayerId, clan.clanId);
    return { ok: true, clan: structuredClone(clan) };
  }

  get(clanId) {
    const clan = this.#clans.get(clanId);
    return clan ? structuredClone(clan) : null;
  }

  addMember(clanId, playerId, role = "member") {
    const clan = this.#clans.get(clanId);
    if (!clan) return { ok: false, error: "clan_not_found" };
    playerId = String(playerId || "").trim();
    if (!playerId || this.#memberToClan.has(playerId))
      return { ok: false, error: "player_already_in_clan" };
    if (clan.members.length >= clan.memberLimit)
      return { ok: false, error: "clan_full" };
    if (!ROLES.has(role)) return { ok: false, error: "invalid_clan_role" };

    clan.members.push({ playerId, role, joinedAt: new Date().toISOString() });
    this.#memberToClan.set(playerId, clanId);
    return { ok: true, clan: structuredClone(clan) };
  }

  removeMember(clanId, playerId) {
    const clan = this.#clans.get(clanId);
    if (!clan) return { ok: false, error: "clan_not_found" };
    const member = clan.members.find(entry => entry.playerId === playerId);
    if (!member) return { ok: false, error: "clan_member_not_found" };
    if (member.role === "owner") return { ok: false, error: "owner_transfer_required" };

    clan.members = clan.members.filter(entry => entry.playerId !== playerId);
    this.#memberToClan.delete(playerId);
    return { ok: true, clan: structuredClone(clan) };
  }

  setRole(clanId, actorPlayerId, targetPlayerId, role) {
    const clan = this.#clans.get(clanId);
    if (!clan) return { ok: false, error: "clan_not_found" };
    const actor = clan.members.find(entry => entry.playerId === actorPlayerId);
    const target = clan.members.find(entry => entry.playerId === targetPlayerId);
    if (!actor || !target) return { ok: false, error: "clan_member_not_found" };
    if (!["owner", "officer"].includes(actor.role))
      return { ok: false, error: "insufficient_clan_role" };
    if (!ROLES.has(role) || role === "owner")
      return { ok: false, error: "invalid_clan_role_change" };

    target.role = role;
    return { ok: true, clan: structuredClone(clan) };
  }

  sameClan(a, b) {
    return Boolean(this.#memberToClan.get(a) && this.#memberToClan.get(a) === this.#memberToClan.get(b));
  }
}
