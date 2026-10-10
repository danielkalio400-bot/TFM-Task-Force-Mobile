import { readJson, sendJson } from "../http/json.mjs";

export async function handleOperationsReliability(
  request,
  response,
  path,
  { reliability, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/operations-reliability") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "GET" && path === "/v1/dev/operations/health") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, reliability.serviceHealth(url.searchParams.get("region") || "west-africa"));
    return true;
  }

  const createRoutes = new Map([
    ["/v1/dev/operations/availability", body => reliability.recordAvailability(body)],
    ["/v1/dev/operations/deployments", body => reliability.createDeployment(body)],
    ["/v1/dev/operations/crash-diagnostics", body => reliability.recordCrash(body)],
    ["/v1/dev/operations/load-tests", body => reliability.recordLoadTest(body)],
  ]);

  if (request.method === "POST" && createRoutes.has(path)) {
    try {
      const result = createRoutes.get(path)(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const deploymentState = path.match(/^\/v1\/dev\/operations\/deployments\/([^/]+)\/state$/);
  if (deploymentState && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = reliability.updateDeployment(decodeURIComponent(deploymentState[1]), body?.state);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.deployment : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const rollback = path.match(/^\/v1\/dev\/operations\/deployments\/([^/]+)\/rollback$/);
  if (rollback && request.method === "POST") {
    try {
      const result = reliability.rollback(
        decodeURIComponent(rollback[1]),
        await readJson(request)
      );
      sendJson(response, result.ok ? 200 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const regional = path.match(/^\/v1\/dev\/operations\/regions\/([^/]+)$/);
  if (regional && request.method === "POST") {
    try {
      const result = reliability.setRegionalRouting(
        decodeURIComponent(regional[1]),
        await readJson(request)
      );
      sendJson(response, 200, result.state);
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/dev/operations/audit") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { events: reliability.incidentAudit(url.searchParams.get("limit")) });
    return true;
  }

  return false;
}
