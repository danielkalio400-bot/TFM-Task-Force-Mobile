import { readJson, sendJson } from "../http/json.mjs";

export async function handleReleaseObservability(request, response, path, { quality, contract }) {
  if (request.method === "GET" && path === "/v1/runtime/release-observability") {
    sendJson(response, 200, contract); return true;
  }
  if (request.method === "POST" && path === "/v1/dev/release-quality/samples") {
    try {
      const result = quality.ingest(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.sample : { error: result.error }); return true;
    } catch (error) { sendJson(response, 400, { error: error?.code || "invalid_request" }); return true; }
  }
  if (request.method === "GET" && path === "/v1/dev/release-quality/samples") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { samples: quality.listSamples({
      artifactId: url.searchParams.get("artifactId") || "",
      platform: url.searchParams.get("platform") || "",
      cohort: url.searchParams.get("cohort") || "",
      limit: url.searchParams.get("limit") || 250,
    })}); return true;
  }
  if (request.method === "POST" && path === "/v1/dev/release-quality/baselines") {
    try {
      const result = quality.setBaseline(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.baseline : { error: result.error }); return true;
    } catch (error) { sendJson(response, 400, { error: error?.code || "invalid_request" }); return true; }
  }
  if (request.method === "GET" && path === "/v1/dev/release-quality/baselines") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { baselines: quality.listBaselines(url.searchParams.get("platform") || "") }); return true;
  }
  if (request.method === "POST" && path === "/v1/dev/release-quality/evaluate") {
    try {
      const result = quality.evaluate(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.report : { error: result.error }); return true;
    } catch (error) { sendJson(response, 400, { error: error?.code || "invalid_request" }); return true; }
  }
  const report = path.match(/^\/v1\/dev\/release-quality\/reports\/([^/]+)$/);
  if (report && request.method === "GET") {
    const state = quality.getReport(decodeURIComponent(report[1]));
    sendJson(response, state ? 200 : 404, state || { error: "release_quality_report_not_found" }); return true;
  }
  if (request.method === "GET" && path === "/v1/dev/release-quality/audit") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { events: quality.audit(url.searchParams.get("limit")) }); return true;
  }
  return false;
}
