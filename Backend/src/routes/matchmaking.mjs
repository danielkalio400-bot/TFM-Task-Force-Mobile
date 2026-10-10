import { readJson, sendJson } from "../http/json.mjs";

function tailId(path, prefix) {
  if (!path.startsWith(prefix)) return null;
  const value = path.slice(prefix.length);
  return value && !value.includes("/") ? decodeURIComponent(value) : null;
}

export async function handleMatchmaking(request, response, path, matchmaking) {
  if (request.method === "POST" && path === "/v1/matchmaking/tickets") {
    try {
      const body = await readJson(request);
      const result = matchmaking.createTicket(body);
      if (!result.ok) {
        sendJson(response, 400, { error: result.error });
        return true;
      }
      sendJson(response, 201, result.ticket);
      return true;
    } catch (error) {
      const status = error?.code === "request_too_large" ? 413 : 400;
      sendJson(response, status, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const ticketId = tailId(path, "/v1/matchmaking/tickets/");
  if (ticketId && request.method === "GET") {
    const ticket = matchmaking.getTicket(ticketId);
    sendJson(response, ticket ? 200 : 404, ticket || { error: "ticket_not_found" });
    return true;
  }

  if (ticketId && request.method === "DELETE") {
    const ticket = matchmaking.cancelTicket(ticketId);
    sendJson(response, ticket ? 200 : 404, ticket || { error: "ticket_not_found" });
    return true;
  }

  if (request.method === "GET" && path === "/v1/matchmaking/stats") {
    sendJson(response, 200, matchmaking.stats());
    return true;
  }

  const matchId = tailId(path, "/v1/matches/");
  if (matchId && request.method === "GET") {
    const match = matchmaking.getMatch(matchId);
    sendJson(response, match ? 200 : 404, match || { error: "match_not_found" });
    return true;
  }

  return false;
}
