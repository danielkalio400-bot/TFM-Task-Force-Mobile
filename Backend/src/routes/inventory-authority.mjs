import { readJson, sendJson } from "../http/json.mjs";

export async function handleInventoryAuthority(
  request,
  response,
  path,
  { authority, sessions, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/inventory-authority") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/inventory-authority/transactions") {
    try {
      const result = authority.mutate(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const balance = path.match(/^\/v1\/inventory\/([^/]+)\/balance$/);
  if (balance && request.method === "GET") {
    const auth = request.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    const session = sessions.validate(token);
    if (!session.ok) {
      sendJson(response, 401, { error: session.error });
      return true;
    }

    const result = authority.balance(session.session.playerId, decodeURIComponent(balance[1]));
    sendJson(response, result.ok ? 200 : 400, result.ok ? result.balance : { error: result.error });
    return true;
  }

  if (request.method === "GET" && path === "/v1/inventory/history") {
    const auth = request.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    const session = sessions.validate(token);
    if (!session.ok) {
      sendJson(response, 401, { error: session.error });
      return true;
    }

    const url = new URL(request.url || "/", "http://localhost");
    const result = authority.history(session.session.playerId, url.searchParams.get("limit"));
    sendJson(response, 200, result);
    return true;
  }

  return false;
}
