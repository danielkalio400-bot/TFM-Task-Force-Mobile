import { readJson, sendJson } from "../http/json.mjs";

export async function handleProfiles(request, response, path, profiles) {
  const match = path.match(/^\/v1\/profiles\/([^/]+)\/progression$/);
  if (!match) return false;

  const playerId = decodeURIComponent(match[1]);

  if (request.method === "GET") {
    const progression = profiles.getOrCreate(playerId);
    sendJson(response, progression ? 200 : 400,
      progression || { error: "invalid_player" });
    return true;
  }

  if (request.method === "POST") {
    try {
      const result = profiles.grant(playerId, await readJson(request));
      sendJson(response, result.ok ? 200 : 400,
        result.ok ? result.progression : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, error?.code === "request_too_large" ? 413 : 400, {
        error: error?.code || "invalid_request",
      });
      return true;
    }
  }

  return false;
}
