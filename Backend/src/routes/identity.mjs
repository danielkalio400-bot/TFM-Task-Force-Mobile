import { readJson, sendJson } from "../http/json.mjs";

export async function handleIdentity(
  request,
  response,
  path,
  { identity, audit, deletions, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/identity-boundary") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/identity/validated-claims") {
    try {
      const result = identity.acceptValidatedClaims(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/identity/revoke") {
    try {
      const body = await readJson(request);
      const result = identity.revokeSession(body?.token, body?.subjectRef);
      sendJson(response, result.ok ? 200 : 404, result.ok ? { revoked: true } : { error: "session_not_found" });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/dev/identity/audit") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { events: audit.recent(url.searchParams.get("limit")) });
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/data-deletion-requests") {
    try {
      const result = deletions.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.request : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const deletion = path.match(/^\/v1\/dev\/data-deletion-requests\/([^/]+)\/state$/);
  if (deletion && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = deletions.update(decodeURIComponent(deletion[1]), body?.state);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.request : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
