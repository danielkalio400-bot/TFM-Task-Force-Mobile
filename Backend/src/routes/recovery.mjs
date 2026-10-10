import { readJson, sendJson } from "../http/json.mjs";

export async function handleRecovery(request, response, path, recovery) {
  if (request.method === "POST" && path === "/v1/session-recovery") {
    try {
      const body = await readJson(request);
      const result = recovery.issue(body?.playerId, body?.matchId);
      sendJson(response, result.ok ? 201 : 400,
        result.ok ? result.recovery : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const match = path.match(/^\/v1\/session-recovery\/([^/]+)\/consume$/);
  if (request.method === "POST" && match) {
    try {
      const body = await readJson(request);
      const result = recovery.consume(decodeURIComponent(match[1]), body?.playerId);
      sendJson(response, result.ok ? 200 : 400,
        result.ok ? result.recovery : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
