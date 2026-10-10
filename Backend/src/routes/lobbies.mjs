import { readJson, sendJson } from "../http/json.mjs";

function parseLobbyPath(path) {
  const match = path.match(/^\/v1\/lobbies\/([^/]+)(?:\/(join|leave))?$/);
  return match ? { lobbyId: decodeURIComponent(match[1]), action: match[2] || "" } : null;
}

export async function handleLobbies(request, response, path, lobbies) {
  if (request.method === "POST" && path === "/v1/lobbies") {
    try {
      const result = lobbies.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.lobby : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, error?.code === "request_too_large" ? 413 : 400, {
        error: error?.code || "invalid_request",
      });
      return true;
    }
  }

  const parsed = parseLobbyPath(path);
  if (!parsed) return false;

  if (request.method === "GET" && !parsed.action) {
    const lobby = lobbies.get(parsed.lobbyId);
    sendJson(response, lobby ? 200 : 404, lobby || { error: "lobby_not_found" });
    return true;
  }

  if (request.method === "POST" && parsed.action === "join") {
    try {
      const result = lobbies.join(parsed.lobbyId, await readJson(request));
      sendJson(response, result.ok ? 200 : result.error === "lobby_not_found" ? 404 : 400,
        result.ok ? result.lobby : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && parsed.action === "leave") {
    try {
      const body = await readJson(request);
      const result = lobbies.leave(parsed.lobbyId, body?.playerId);
      sendJson(response, result.ok ? 200 : 404, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
