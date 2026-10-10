import { readJson, sendJson } from "../http/json.mjs";

export async function handleCompetitive(request, response, path, { privateMatches, ranked }) {
  if (request.method === "POST" && path === "/v1/private-matches") {
    try {
      const result = privateMatches.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400,
        result.ok ? result.match : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const privateMatch = path.match(/^\/v1\/private-matches\/([^/]+)(?:\/(join))?$/);
  if (privateMatch) {
    const id = decodeURIComponent(privateMatch[1]);

    if (request.method === "GET" && !privateMatch[2]) {
      const match = privateMatches.get(id);
      sendJson(response, match ? 200 : 404, match || { error: "private_match_not_found" });
      return true;
    }

    if (request.method === "POST" && privateMatch[2] === "join") {
      try {
        const body = await readJson(request);
        const result = privateMatches.join(id, body?.playerId);
        sendJson(response, result.ok ? 200 : 400,
          result.ok ? result.match : { error: result.error });
        return true;
      } catch (error) {
        sendJson(response, 400, { error: error?.code || "invalid_request" });
        return true;
      }
    }
  }

  const rankPath = path.match(/^\/v1\/ranked\/([^/]+)$/);
  if (rankPath && request.method === "GET") {
    return sendJson(response, 200, ranked.get(decodeURIComponent(rankPath[1])));
  }

  if (rankPath && request.method === "POST") {
    try {
      const body = await readJson(request);
      return sendJson(response, 200, ranked.applyResult(
        decodeURIComponent(rankPath[1]),
        Boolean(body?.won),
        Number(body?.opponentAverageRating) || 0,
      ));
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
