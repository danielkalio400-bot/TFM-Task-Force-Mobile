import { readJson, sendJson } from "../http/json.mjs";

export async function handleProductionSession(
  request,
  response,
  path,
  { entitlements, contentCompatibility, dedicatedSessions, recovery, telemetry, contracts }
) {
  if (request.method === "GET" && path === "/v1/runtime/production-telemetry-gates") {
    sendJson(response, 200, contracts.telemetry);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/entitlements") {
    try {
      const result = entitlements.grant(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.entitlement : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/entitlements/check-section") {
    try {
      const body = await readJson(request);
      const sectionId = String(body?.sectionId || "");
      const requiredPackIds = contentCompatibility.sectionPackIds[sectionId];
      if (!requiredPackIds) {
        sendJson(response, 400, { error: "unknown_section" });
        return true;
      }
      sendJson(response, 200, entitlements.checkSection(body?.playerId, requiredPackIds));
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/dedicated-sessions/allocate") {
    try {
      const result = dedicatedSessions.allocate(await readJson(request));
      sendJson(response, result.ok ? 201 : 409, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/authoritative-recovery") {
    try {
      const result = recovery.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.recovery : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const consume = path.match(/^\/v1\/dev\/authoritative-recovery\/([^/]+)\/consume$/);
  if (consume && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = recovery.consume(decodeURIComponent(consume[1]), body?.playerId);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/telemetry-gates/evaluate") {
    try {
      const result = telemetry.evaluate(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.report : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
