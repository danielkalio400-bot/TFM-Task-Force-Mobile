export class PrivacyService {
  #settings = new Map();

  get(playerId) {
    const key = String(playerId || "").trim();
    if (!key) return null;

    if (!this.#settings.has(key)) {
      this.#settings.set(key, {
        playerId: key,
        profileVisibility: "friends",
        showOnlineStatus: true,
        allowFriendRequests: true,
        allowClanInvites: true,
        allowPartyInvitesFromFriends: true,
        allowPartyInvitesFromClan: true,
        allowDirectMessagesFromFriends: true,
        allowDirectMessagesFromClan: true,
      });
    }

    return { ...this.#settings.get(key) };
  }

  update(playerId, input) {
    const current = this.get(playerId);
    if (!current) return { ok: false, error: "invalid_player_id" };

    const allowedVisibility = new Set(["private", "friends", "clan-and-friends", "public"]);
    if (input?.profileVisibility !== undefined) {
      const visibility = String(input.profileVisibility);
      if (!allowedVisibility.has(visibility))
        return { ok: false, error: "invalid_profile_visibility" };
      current.profileVisibility = visibility;
    }

    for (const key of [
      "showOnlineStatus",
      "allowFriendRequests",
      "allowClanInvites",
      "allowPartyInvitesFromFriends",
      "allowPartyInvitesFromClan",
      "allowDirectMessagesFromFriends",
      "allowDirectMessagesFromClan",
    ]) {
      if (input?.[key] !== undefined) current[key] = Boolean(input[key]);
    }

    this.#settings.set(current.playerId, current);
    return { ok: true, settings: { ...current } };
  }
}
