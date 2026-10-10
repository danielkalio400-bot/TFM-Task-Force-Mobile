import { readJson, sendJson } from "../http/json.mjs";

export async function handleRuntimeOrchestration(
  request,
  response,
  path,
  { modeRuntime, partyQueue, resultPipeline, liveOperations }
) {
  if (request.method === "POST" && path === "/v1/dev/mode-runtimes") {
    try {
      const result = modeRuntime.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.runtime : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const runtime = path.match(/^\/v1\/dev\/mode-runtimes\/([^/]+)$/);
  if (runtime && request.method === "GET") {
    const state = modeRuntime.get(decodeURIComponent(runtime[1]));
    sendJson(response, state ? 200 : 404, state || { error: "mode_runtime_not_found" });
    return true;
  }
  if (runtime && request.method === "POST") {
    try {
      const result = modeRuntime.update(decodeURIComponent(runtime[1]), await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.runtime : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/party-queue") {
    try {
      const result = partyQueue.enqueue(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.queue : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/result-pipeline") {
    try {
      const result = resultPipeline.process(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (path === "/v1/dev/live-operations" && request.method === "GET") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, liveOperations.get(url.searchParams.get("region") || "west-africa"));
    return true;
  }
  if (path === "/v1/dev/live-operations" && request.method === "POST") {
    try {
      const body = await readJson(request);
      sendJson(response, 200, liveOperations.update(body?.region || "west-africa", body));
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
