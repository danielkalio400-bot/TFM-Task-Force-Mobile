import { readJson, sendJson } from "../http/json.mjs";

function bearer(request) {
  const value = request.headers.authorization || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export async function handleLiveServices(
  request,
  response,
  path,
  { sessions, inventory, matchResults, moderation }
) {
  if (request.method === "POST" && path === "/v1/dev/sessions") {
    try {
      const body = await readJson(request);
      const result = sessions.issueForValidatedSubject(body?.validatedSubject);
      sendJson(response, result.ok ? 201 : 400,
        result.ok ? result.session : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/session") {
    const result = sessions.validate(bearer(request));
    sendJson(response, result.ok ? 200 : 401,
      result.ok ? result.session : { error: result.error });
    return true;
  }

  if (request.method === "POST" && path === "/v1/inventory/transactions") {
    const session = sessions.validate(bearer(request));
    if (!session.ok) {
      sendJson(response, 401, { error: session.error });
      return true;
    }

    sendJson(response, 403, {
      error: "server_inventory_authority_required",
      message: "Direct client-authored inventory mutations are disabled."
    });
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/match-results") {
    try {
      const result = matchResults.ingest(await readJson(request));
      sendJson(response, result.ok ? 201 : 400,
        result.ok ? result.result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const match = path.match(/^\/v1\/matches\/([^/]+)\/result$/);
  if (request.method === "GET" && match) {
    const result = matchResults.get(decodeURIComponent(match[1]));
    sendJson(response, result ? 200 : 404, result || { error: "match_result_not_found" });
    return true;
  }

  if (request.method === "POST" && path === "/v1/moderation/reports") {
    const session = sessions.validate(bearer(request));
    if (!session.ok) {
      sendJson(response, 401, { error: session.error });
      return true;
    }

    try {
      const body = await readJson(request);
      const result = moderation.submit({
        ...body,
        reporterPlayerId: session.session.playerId,
      });
      sendJson(response, result.ok ? 201 : 400,
        result.ok ? result.report : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
