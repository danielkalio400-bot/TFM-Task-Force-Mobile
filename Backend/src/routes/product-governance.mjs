import { readJson, sendJson } from "../http/json.mjs";

export async function handleProductGovernance(request, response, path, { governance, contract }) {
  if (request.method === "GET" && path === "/v1/runtime/product-governance") {
    sendJson(response, 200, contract);
    return true;
  }

  const createRoutes = new Map([
    ["/v1/dev/governance/risks", body => governance.updateRisk(body)],
    ["/v1/dev/governance/evidence", body => governance.recordEvidence(body)],
    ["/v1/dev/governance/device-profiles", body => governance.recordDeviceProfile(body)],
    ["/v1/dev/governance/asset-provenance", body => governance.recordAssetProvenance(body)],
  ]);

  if (request.method === "POST" && createRoutes.has(path)) {
    try {
      const result = createRoutes.get(path)(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/governance/maturity") {
    try {
      const body = await readJson(request);
      const result = governance.evaluateMaturity(body?.requestedStage);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.report : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/dev/governance/snapshot") {
    sendJson(response, 200, governance.snapshot());
    return true;
  }

  if (request.method === "GET" && path === "/v1/dev/governance/audit") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { events: governance.audit(url.searchParams.get("limit")) });
    return true;
  }

  return false;
}
