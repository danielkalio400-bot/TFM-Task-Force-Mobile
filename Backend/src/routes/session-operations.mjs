import { readJson, sendJson } from "../http/json.mjs";

export async function handleSessionOperations(
  request,
  response,
  path,
  { queues, sessions, drains, incidents, fairPlay }
) {
  if (request.method === "POST" && path === "/v1/regional-queues") {
    try {
      const result = queues.join(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.entry : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const queueCancel = path.match(/^\/v1\/regional-queues\/([^/]+)\/cancel$/);
  if (request.method === "POST" && queueCancel) {
    const result = queues.cancel(decodeURIComponent(queueCancel[1]));
    sendJson(response, result.ok ? 200 : 404, result.ok ? result.entry : { error: result.error });
    return true;
  }

  if (request.method === "POST" && path === "/v1/match-sessions") {
    try {
      const result = sessions.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.session : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const transition = path.match(/^\/v1\/match-sessions\/([^/]+)\/transition$/);
  if (request.method === "POST" && transition) {
    try {
      const body = await readJson(request);
      const result = sessions.transition(
        decodeURIComponent(transition[1]),
        body?.phase,
        body
      );
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.session : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/server-drains") {
    try {
      const body = await readJson(request);
      const result = drains.request(body?.serverId, body?.mode, body?.reasonCode);
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.drain : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/incidents") {
    try {
      const result = incidents.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.incident : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/dev/incidents/open") {
    sendJson(response, 200, { incidents: incidents.open() });
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/fairplay/signals") {
    try {
      const result = fairPlay.record(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.signal : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  return false;
}
