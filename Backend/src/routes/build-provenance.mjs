import { readJson, sendJson } from "../http/json.mjs";

export async function handleBuildProvenance(request, response, path, { builds, contract }) {
  if (request.method === "GET" && path === "/v1/runtime/build-provenance") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/build-artifacts") {
    try {
      const result = builds.register(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.artifact : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/dev/build-artifacts") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, {
      artifacts: builds.list(url.searchParams.get("platform") || ""),
    });
    return true;
  }

  const verify = path.match(/^\/v1\/dev\/build-artifacts\/([^/]+)\/verify$/);
  if (verify && request.method === "POST") {
    const result = builds.verify(decodeURIComponent(verify[1]));
    sendJson(response, result.ok ? 200 : 400, result.ok ? result : { error: result.error });
    return true;
  }

  const promote = path.match(/^\/v1\/dev\/build-artifacts\/([^/]+)\/promote$/);
  if (promote && request.method === "POST") {
    const result = builds.promote(decodeURIComponent(promote[1]));
    sendJson(response, result.ok ? 200 : 400, result.ok ? result.artifact : { error: result.error });
    return true;
  }

  const revoke = path.match(/^\/v1\/dev\/build-artifacts\/([^/]+)\/revoke$/);
  if (revoke && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = builds.revoke(decodeURIComponent(revoke[1]), body?.reasonCode);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.artifact : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const artifact = path.match(/^\/v1\/dev\/build-artifacts\/([^/]+)$/);
  if (artifact && request.method === "GET") {
    const state = builds.get(decodeURIComponent(artifact[1]));
    sendJson(response, state ? 200 : 404, state || { error: "build_artifact_not_found" });
    return true;
  }

  if (request.method === "GET" && path === "/v1/dev/build-artifacts-audit") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { events: builds.audit(url.searchParams.get("limit")) });
    return true;
  }

  return false;
}
