import { readJson, sendJson } from "../http/json.mjs";

export async function handleOperations(request, response, path, { servers, assignments, mapVotes, telemetry }) {
  if (request.method === "POST" && path === "/v1/dev/servers/heartbeat") {
    try {
      const result = servers.heartbeat(await readJson(request));
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.server : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/server-assignments") {
    try {
      const body = await readJson(request);
      const result = assignments.assign(body?.matchId, body?.region);
      sendJson(response, result.ok ? 201 : 503, result.ok ? result.assignment : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/map-votes") {
    try {
      const result = mapVotes.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.vote : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const vote = path.match(/^\/v1\/map-votes\/([^/]+)(?:\/(cast|finalize))?$/);
  if (vote) {
    const voteId = decodeURIComponent(vote[1]);
    if (request.method === "GET" && !vote[2]) {
      const state = mapVotes.get(voteId);
      sendJson(response, state ? 200 : 404, state || { error: "map_vote_not_found" });
      return true;
    }

    if (request.method === "POST" && vote[2] === "cast") {
      try {
        const body = await readJson(request);
        const result = mapVotes.cast(voteId, body?.playerId, body?.mapId);
        sendJson(response, result.ok ? 200 : 400, result.ok ? result.vote : { error: result.error });
        return true;
      } catch (error) {
        sendJson(response, 400, { error: error?.code || "invalid_request" });
        return true;
      }
    }

    if (request.method === "POST" && vote[2] === "finalize") {
      const result = mapVotes.finalize(voteId);
      sendJson(response, result.ok ? 200 : 404, result.ok ? result.vote : { error: result.error });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/telemetry/performance") {
    try {
      const result = telemetry.record(await readJson(request));
      sendJson(response, 201, result.sample);
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/dev/telemetry/performance/summary") {
    sendJson(response, 200, telemetry.summary());
    return true;
  }

  return false;
}
