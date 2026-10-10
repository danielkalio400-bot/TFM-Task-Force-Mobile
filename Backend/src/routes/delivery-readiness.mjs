import { readJson, sendJson } from "../http/json.mjs";

export async function handleDeliveryReadiness(
  request,
  response,
  path,
  { delivery, launch, release, contracts }
) {
  if (request.method === "GET" && path === "/v1/runtime/content-delivery") {
    sendJson(response, 200, contracts.delivery);
    return true;
  }
  if (request.method === "GET" && path === "/v1/runtime/release-readiness") {
    sendJson(response, 200, contracts.release);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/content-delivery/packages") {
    try {
      const result = delivery.publish(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.package : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const packageRoute = path.match(/^\/v1\/dev\/content-delivery\/packages\/([^/]+)$/);
  if (packageRoute && request.method === "POST") {
    try {
      const result = delivery.update(decodeURIComponent(packageRoute[1]), await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.package : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/section-launch") {
    try {
      const result = launch.launch(await readJson(request));
      sendJson(response, result.ok ? 201 : 409, result.ok ? result : { error: result.error, ...result });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/release-readiness/evaluate") {
    try {
      const result = release.evaluate(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.report : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
