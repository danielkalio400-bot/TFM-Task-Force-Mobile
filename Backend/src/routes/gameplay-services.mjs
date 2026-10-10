import { readJson, sendJson } from "../http/json.mjs";

export async function handleGameplayServices(
  request,
  response,
  path,
  { parties, rewards, restores, health }
) {
  if (request.method === "POST" && path === "/v1/parties") {
    try {
      const result = parties.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.party : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const party = path.match(/^\/v1\/parties\/([^/]+)(?:\/(join|ready|composition))?$/);
  if (party) {
    const partyId = decodeURIComponent(party[1]);

    if (request.method === "GET" && !party[2]) {
      const state = parties.get(partyId);
      sendJson(response, state ? 200 : 404, state || { error: "party_not_found" });
      return true;
    }

    if (request.method === "GET" && party[2] === "composition") {
      const state = parties.composition(partyId);
      sendJson(response, state ? 200 : 404, state || { error: "party_not_found" });
      return true;
    }

    if (request.method === "POST" && party[2] === "join") {
      try {
        const result = parties.join(partyId, await readJson(request));
        sendJson(response, result.ok ? 200 : 400, result.ok ? result.party : { error: result.error });
        return true;
      } catch (error) {
        sendJson(response, 400, { error: error?.code || "invalid_request" });
        return true;
      }
    }

    if (request.method === "POST" && party[2] === "ready") {
      try {
        const body = await readJson(request);
        const result = parties.setReady(partyId, body?.playerId, body?.ready);
        sendJson(response, result.ok ? 200 : 400, result.ok ? result.party : { error: result.error });
        return true;
      } catch (error) {
        sendJson(response, 400, { error: error?.code || "invalid_request" });
        return true;
      }
    }
  }

  if (request.method === "POST" && path === "/v1/dev/rewards") {
    try {
      const result = rewards.calculate(await readJson(request));
      sendJson(response, result.ok ? 201 : 409, result.ok ? result.reward : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/reconnect-restores") {
    try {
      const result = restores.create(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.restore : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const restore = path.match(/^\/v1\/dev\/reconnect-restores\/([^/]+)\/consume$/);
  if (request.method === "POST" && restore) {
    try {
      const body = await readJson(request);
      const result = restores.consume(decodeURIComponent(restore[1]), body?.playerId);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.restore : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "GET" && path === "/v1/dev/operations/health") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, health.snapshot(url.searchParams.get("region") || "west-africa"));
    return true;
  }

  return false;
}
