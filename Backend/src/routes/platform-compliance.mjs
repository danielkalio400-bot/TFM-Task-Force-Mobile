import { readJson, sendJson } from "../http/json.mjs";

export async function handlePlatformCompliance(request, response, path, { compliance, contract }) {
  if (request.method === "GET" && path === "/v1/runtime/platform-compliance") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/platform-compliance/checks") {
    try {
      const result = compliance.upsertCheck(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.check : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/dev/platform-compliance/checks") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { checks: compliance.list(url.searchParams.get("platform") || "") });
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/platform-compliance/evaluate") {
    try {
      const result = compliance.evaluate(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.report : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const report = path.match(/^\/v1\/dev\/platform-compliance\/reports\/([^/]+)$/);
  if (report && request.method === "GET") {
    const state = compliance.getReport(decodeURIComponent(report[1]));
    sendJson(response, state ? 200 : 404, state || { error: "compliance_report_not_found" });
    return true;
  }

  if (request.method === "GET" && path === "/v1/dev/platform-compliance/audit") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { events: compliance.audit(url.searchParams.get("limit")) });
    return true;
  }

  return false;
}
