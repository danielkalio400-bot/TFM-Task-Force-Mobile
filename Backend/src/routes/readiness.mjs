import { readJson, sendJson } from "../http/json.mjs";

export async function handleReadiness(
  request,
  response,
  path,
  { compatibility, mapReadiness, persistence, lifecycles, contracts }
) {
  if (request.method === "GET" && path === "/v1/runtime/content-compatibility") {
    sendJson(response, 200, contracts.compatibility);
    return true;
  }
  if (request.method === "GET" && path === "/v1/runtime/map-readiness") {
    sendJson(response, 200, contracts.mapReadiness);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/content-compatibility/check") {
    try {
      const result = compatibility.evaluate(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.report : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const map = path.match(/^\/v1\/dev\/maps\/([^/]+)\/readiness$/);
  if (map && request.method === "GET") {
    const readiness = mapReadiness.get(decodeURIComponent(map[1]));
    sendJson(response, readiness ? 200 : 404, readiness ? mapReadiness.describe(readiness) : { error: "map_not_found" });
    return true;
  }
  if (map && request.method === "POST") {
    try {
      const result = mapReadiness.update(decodeURIComponent(map[1]), await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.readiness : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/session-snapshots") {
    try {
      const result = persistence.save(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.snapshot : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const snapshot = path.match(/^\/v1\/dev\/session-snapshots\/([^/]+)$/);
  if (snapshot && request.method === "GET") {
    const latest = persistence.latest(decodeURIComponent(snapshot[1]));
    sendJson(response, latest ? 200 : 404, latest || { error: "session_snapshot_not_found" });
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/section-lifecycles") {
    try {
      const result = lifecycles.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.lifecycle : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const lifecycle = path.match(/^\/v1\/dev\/section-lifecycles\/([^/]+)(?:\/move)?$/);
  if (lifecycle && request.method === "GET") {
    const state = lifecycles.get(decodeURIComponent(lifecycle[1]));
    sendJson(response, state ? 200 : 404, state || { error: "section_lifecycle_not_found" });
    return true;
  }
  if (lifecycle && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = lifecycles.move(
        decodeURIComponent(lifecycle[1]),
        body?.phase,
        body?.failureCode
      );
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.lifecycle : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
