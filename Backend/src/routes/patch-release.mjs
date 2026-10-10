import { readJson, sendJson } from "../http/json.mjs";

export async function handlePatchRelease(request, response, path, { patches, contract }) {
  if (request.method === "GET" && path === "/v1/runtime/patch-release") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/patches") {
    try {
      const result = patches.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.patch : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/patches/resolve") {
    try {
      const result = patches.resolve(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.decision : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const publish = path.match(/^\/v1\/dev\/patches\/([^/]+)\/publish$/);
  if (publish && request.method === "POST") {
    const result = patches.publish(decodeURIComponent(publish[1]));
    sendJson(response, result.ok ? 200 : 400, result.ok ? result.patch : { error: result.error });
    return true;
  }

  const rollout = path.match(/^\/v1\/dev\/patches\/([^/]+)\/rollout$/);
  if (rollout && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = patches.setRollout(decodeURIComponent(rollout[1]), body?.rolloutPercent);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.patch : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const rollback = path.match(/^\/v1\/dev\/patches\/([^/]+)\/rollback$/);
  if (rollback && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = patches.rollback(decodeURIComponent(rollback[1]), body?.reasonCode);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const getPatch = path.match(/^\/v1\/dev\/patches\/([^/]+)$/);
  if (getPatch && request.method === "GET") {
    const patch = patches.get(decodeURIComponent(getPatch[1]));
    sendJson(response, patch ? 200 : 404, patch || { error: "patch_not_found" });
    return true;
  }

  if (request.method === "GET" && path === "/v1/dev/patches-audit") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, { events: patches.audit(url.searchParams.get("limit")) });
    return true;
  }

  return false;
}
