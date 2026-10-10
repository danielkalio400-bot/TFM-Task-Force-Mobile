import { readJson, sendJson } from "../http/json.mjs";

export async function handleAuthoritativeResults(
  request,
  response,
  path,
  { archive, replay, pipeline, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/authoritative-match-records") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/authoritative-results") {
    try {
      const result = pipeline.process(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const resultRoute = path.match(/^\/v1\/dev\/authoritative-results\/([^/]+)$/);
  if (resultRoute && request.method === "GET") {
    const result = archive.get(decodeURIComponent(resultRoute[1]));
    sendJson(response, result ? 200 : 404, result || { error: "authoritative_match_not_found" });
    return true;
  }

  const replayEvent = path.match(/^\/v1\/dev\/replay-telemetry\/([^/]+)\/events$/);
  if (replayEvent && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = replay.append({
        ...body,
        matchId: decodeURIComponent(replayEvent[1]),
      });
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.event : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (replayEvent && request.method === "GET") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, {
      events: replay.read(
        decodeURIComponent(replayEvent[1]),
        url.searchParams.get("from"),
        url.searchParams.get("limit")
      ),
    });
    return true;
  }

  const seal = path.match(/^\/v1\/dev\/replay-telemetry\/([^/]+)\/seal$/);
  if (seal && request.method === "POST") {
    const result = replay.seal(decodeURIComponent(seal[1]));
    sendJson(response, result.ok ? 200 : 400, result.ok ? result.manifest : { error: result.error });
    return true;
  }

  const manifest = path.match(/^\/v1\/dev\/replay-telemetry\/([^/]+)\/manifest$/);
  if (manifest && request.method === "GET") {
    sendJson(response, 200, replay.manifest(decodeURIComponent(manifest[1])));
    return true;
  }

  return false;
}
