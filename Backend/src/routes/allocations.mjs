import { readJson, sendJson } from "../http/json.mjs";

export async function handleAllocations(request, response, path, allocations) {
  if (request.method === "POST" && path === "/v1/server-allocations") {
    try {
      const result = allocations.create(await readJson(request));
      sendJson(response, result.ok ? 202 : 400,
        result.ok ? result.allocation : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, error?.code === "request_too_large" ? 413 : 400, {
        error: error?.code || "invalid_request",
      });
      return true;
    }
  }

  const match = path.match(/^\/v1\/server-allocations\/([^/]+)$/);
  if (request.method === "GET" && match) {
    const allocation = allocations.get(decodeURIComponent(match[1]));
    sendJson(response, allocation ? 200 : 404,
      allocation || { error: "allocation_not_found" });
    return true;
  }

  return false;
}
