import { readJson, sendJson } from "../http/json.mjs";

export async function handleProgressionAuthority(
  request,
  response,
  path,
  { authority, audit, unlocks, leaderboard, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/progression-authority") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/progression-authority/grants") {
    try {
      const result = authority.grant(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const auditRoute = path.match(/^\/v1\/dev\/progression-audit\/([^/]+)$/);
  if (auditRoute && request.method === "GET") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, {
      events: audit.list(decodeURIComponent(auditRoute[1]), url.searchParams.get("limit")),
    });
    return true;
  }

  const unlockRoute = path.match(/^\/v1\/dev\/progression-unlocks\/([^/]+)$/);
  if (unlockRoute && request.method === "GET") {
    sendJson(response, 200, { unlocks: unlocks.list(decodeURIComponent(unlockRoute[1])) });
    return true;
  }

  if (request.method === "GET" && path === "/v1/dev/leaderboards/progression") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, {
      entries: leaderboard.top(url.searchParams.get("limit")),
    });
    return true;
  }

  return false;
}
