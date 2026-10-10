import { readJson, sendJson } from "../http/json.mjs";

export async function handleContentSession(
  request,
  response,
  path,
  { maps, content, sectionSessions, recovery }
) {
  if (request.method === "GET" && path === "/v1/maps") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { maps: maps.list(url.searchParams.get("section") || "") });
    return true;
  }

  if (request.method === "GET" && path === "/v1/content-packs") {
    sendJson(response, 200, content.catalogView());
    return true;
  }

  const pack = path.match(/^\/v1\/dev\/content-packs\/([^/]+)$/);
  if (request.method === "POST" && pack) {
    try {
      const result = content.update(decodeURIComponent(pack[1]), await readJson(request));
      sendJson(response, result.ok ? 200 : 404, result.ok ? result.state : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/section-sessions") {
    try {
      const result = sectionSessions.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.session : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/section-recovery") {
    try {
      const result = recovery.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.recovery : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const consume = path.match(/^\/v1\/dev\/section-recovery\/([^/]+)\/consume$/);
  if (request.method === "POST" && consume) {
    try {
      const body = await readJson(request);
      const result = recovery.consume(decodeURIComponent(consume[1]), body?.playerId);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.recovery : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
