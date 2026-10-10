import { readJson, sendJson } from "../http/json.mjs";

export async function handleSocialSafety(
  request,
  response,
  path,
  { sanctions, consent, notifications, policy, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/social-safety") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/moderation/sanctions") {
    try {
      const result = sanctions.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.sanction : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const revoke = path.match(/^\/v1\/dev\/moderation\/sanctions\/([^/]+)\/revoke$/);
  if (revoke && request.method === "POST") {
    const result = sanctions.revoke(decodeURIComponent(revoke[1]));
    sendJson(response, result.ok ? 200 : 404, result.ok ? result.sanction : { error: result.error });
    return true;
  }

  const consentRoute = path.match(/^\/v1\/dev\/consent\/([^/]+)$/);
  if (consentRoute && request.method === "GET") {
    const result = consent.get(decodeURIComponent(consentRoute[1]));
    sendJson(response, result ? 200 : 404, result || { error: "consent_settings_not_found" });
    return true;
  }
  if (consentRoute && request.method === "POST") {
    try {
      const result = consent.update(decodeURIComponent(consentRoute[1]), await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.settings : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const notificationRoute = path.match(/^\/v1\/dev\/notification-preferences\/([^/]+)$/);
  if (notificationRoute && request.method === "GET") {
    const result = notifications.get(decodeURIComponent(notificationRoute[1]));
    sendJson(response, result ? 200 : 404, result || { error: "notification_preferences_not_found" });
    return true;
  }
  if (notificationRoute && request.method === "POST") {
    try {
      const result = notifications.update(
        decodeURIComponent(notificationRoute[1]),
        await readJson(request)
      );
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.settings : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/social-safety/evaluate") {
    try {
      const body = await readJson(request);
      const result = policy.evaluate(body?.playerId, body?.actionKey);
      sendJson(response, result.allowed ? 200 : 429, result);
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
