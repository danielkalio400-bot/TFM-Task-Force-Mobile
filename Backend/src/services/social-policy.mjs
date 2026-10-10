export class SocialPolicyService {
  constructor({ friends, clans, privacy }) {
    this.friends = friends;
    this.clans = clans;
    this.privacy = privacy;
  }

  canSeePresence(viewerPlayerId, targetPlayerId) {
    if (viewerPlayerId === targetPlayerId) return true;
    if (this.friends.isBlockedEitherWay(viewerPlayerId, targetPlayerId)) return false;

    const settings = this.privacy.get(targetPlayerId);
    if (!settings?.showOnlineStatus) return false;

    if (settings.profileVisibility === "public") return true;
    if (settings.profileVisibility === "friends")
      return this.friends.areFriends(viewerPlayerId, targetPlayerId);
    if (settings.profileVisibility === "clan-and-friends")
      return this.friends.areFriends(viewerPlayerId, targetPlayerId) ||
             this.clans.sameClan(viewerPlayerId, targetPlayerId);
    return false;
  }

  canInviteToParty(senderPlayerId, recipientPlayerId) {
    if (this.friends.isBlockedEitherWay(senderPlayerId, recipientPlayerId)) return false;
    const settings = this.privacy.get(recipientPlayerId);
    if (this.friends.areFriends(senderPlayerId, recipientPlayerId))
      return settings?.allowPartyInvitesFromFriends !== false;
    if (this.clans.sameClan(senderPlayerId, recipientPlayerId))
      return settings?.allowPartyInvitesFromClan !== false;
    return false;
  }
}
