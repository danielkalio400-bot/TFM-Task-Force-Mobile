import { randomUUID } from "node:crypto";

export class FriendsService {
  #requests = new Map();
  #friends = new Map();
  #blocks = new Set();

  #pair(a, b) {
    return [a, b].sort().join(":");
  }

  block(playerId, blockedPlayerId) {
    playerId = String(playerId || "").trim();
    blockedPlayerId = String(blockedPlayerId || "").trim();
    if (!playerId || !blockedPlayerId || playerId === blockedPlayerId)
      return { ok: false, error: "invalid_block" };

    this.#blocks.add(playerId + ":" + blockedPlayerId);
    this.#friends.delete(this.#pair(playerId, blockedPlayerId));
    return {
      ok: true,
      block: {
        playerId,
        blockedPlayerId,
        createdAt: new Date().toISOString(),
      },
    };
  }

  unblock(playerId, blockedPlayerId) {
    return { ok: this.#blocks.delete(String(playerId || "") + ":" + String(blockedPlayerId || "")) };
  }

  isBlockedEitherWay(a, b) {
    return this.#blocks.has(a + ":" + b) || this.#blocks.has(b + ":" + a);
  }

  sendRequest(senderPlayerId, recipientPlayerId, privacy = null) {
    senderPlayerId = String(senderPlayerId || "").trim();
    recipientPlayerId = String(recipientPlayerId || "").trim();

    if (!senderPlayerId || !recipientPlayerId || senderPlayerId === recipientPlayerId)
      return { ok: false, error: "invalid_friend_request" };
    if (this.isBlockedEitherWay(senderPlayerId, recipientPlayerId))
      return { ok: false, error: "friend_request_blocked" };
    if (privacy && privacy.allowFriendRequests === false)
      return { ok: false, error: "friend_requests_disabled" };
    if (this.#friends.has(this.#pair(senderPlayerId, recipientPlayerId)))
      return { ok: false, error: "already_friends" };

    const duplicate = [...this.#requests.values()].find(request =>
      request.state === "pending" &&
      ((request.senderPlayerId === senderPlayerId && request.recipientPlayerId === recipientPlayerId) ||
       (request.senderPlayerId === recipientPlayerId && request.recipientPlayerId === senderPlayerId))
    );
    if (duplicate) return { ok: false, error: "friend_request_exists" };

    const now = new Date().toISOString();
    const request = {
      requestId: randomUUID(),
      senderPlayerId,
      recipientPlayerId,
      state: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.#requests.set(request.requestId, request);
    return { ok: true, request: { ...request } };
  }

  respond(requestId, recipientPlayerId, accept) {
    const request = this.#requests.get(requestId);
    if (!request) return { ok: false, error: "friend_request_not_found" };
    if (request.recipientPlayerId !== recipientPlayerId)
      return { ok: false, error: "friend_request_recipient_mismatch" };
    if (request.state !== "pending")
      return { ok: false, error: "friend_request_not_pending" };
    if (this.isBlockedEitherWay(request.senderPlayerId, request.recipientPlayerId))
      return { ok: false, error: "friend_request_blocked" };

    request.state = accept ? "accepted" : "declined";
    request.updatedAt = new Date().toISOString();
    if (accept) this.#friends.set(this.#pair(request.senderPlayerId, request.recipientPlayerId), true);

    return { ok: true, request: { ...request } };
  }

  areFriends(a, b) {
    return this.#friends.has(this.#pair(a, b));
  }

  list(playerId) {
    const ids = [];
    for (const pair of this.#friends.keys()) {
      const [a, b] = pair.split(":");
      if (a === playerId) ids.push(b);
      else if (b === playerId) ids.push(a);
    }
    return ids;
  }
}
