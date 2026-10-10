import { readJson, sendJson } from "../http/json.mjs";

export async function handleSocial(
  request,
  response,
  path,
  { friends, privacy, clans, policy, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/social-privacy") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/friends/requests") {
    try {
      const body = await readJson(request);
      const recipientPrivacy = privacy.get(body?.recipientPlayerId);
      const result = friends.sendRequest(body?.senderPlayerId, body?.recipientPlayerId, recipientPrivacy);
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.request : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const responseRoute = path.match(/^\/v1\/dev\/friends\/requests\/([^/]+)\/respond$/);
  if (responseRoute && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = friends.respond(
        decodeURIComponent(responseRoute[1]),
        body?.recipientPlayerId,
        Boolean(body?.accept)
      );
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.request : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/friends/block") {
    try {
      const body = await readJson(request);
      const result = friends.block(body?.playerId, body?.blockedPlayerId);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.block : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const settings = path.match(/^\/v1\/dev\/privacy\/([^/]+)$/);
  if (settings && request.method === "GET") {
    const result = privacy.get(decodeURIComponent(settings[1]));
    sendJson(response, result ? 200 : 404, result || { error: "privacy_settings_not_found" });
    return true;
  }
  if (settings && request.method === "POST") {
    try {
      const result = privacy.update(decodeURIComponent(settings[1]), await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.settings : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/clans") {
    try {
      const result = clans.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.clan : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const clanAction = path.match(/^\/v1\/dev\/clans\/([^/]+)\/(members|roles)$/);
  if (clanAction && request.method === "POST") {
    try {
      const body = await readJson(request);
      const clanId = decodeURIComponent(clanAction[1]);
      const result = clanAction[2] === "members"
        ? clans.addMember(clanId, body?.playerId, body?.role || "member")
        : clans.setRole(clanId, body?.actorPlayerId, body?.targetPlayerId, body?.role);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.clan : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/social/presence-check") {
    try {
      const body = await readJson(request);
      sendJson(response, 200, {
        visible: policy.canSeePresence(body?.viewerPlayerId, body?.targetPlayerId),
      });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/social/party-invite-check") {
    try {
      const body = await readJson(request);
      sendJson(response, 200, {
        allowed: policy.canInviteToParty(body?.senderPlayerId, body?.recipientPlayerId),
      });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
