import { readJson, sendJson } from "../http/json.mjs";

export async function handleMatchmakingAuthority(
  request,
  response,
  path,
  { matchmaking, policy, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/matchmaking-authority") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/matchmaking-authority/tickets") {
    try {
      const result = matchmaking.enqueue(await readJson(request));
      sendJson(response, result.ok ? 201 : 400, result.ok ? result.ticket : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/matchmaking-authority/run") {
    const result = matchmaking.run();
    sendJson(response, 200, result);
    return true;
  }

  if (request.method === "GET" && path === "/v1/dev/matchmaking-authority/stats") {
    sendJson(response, 200, matchmaking.stats());
    return true;
  }

  if (request.method === "GET" && path === "/v1/dev/matchmaking-authority/policy") {
    sendJson(response, 200, {
      maximumSearchSeconds: contract.defaults.maximumSearchSeconds,
      initialSkillDelta: contract.defaults.initialSkillDelta,
      maximumSkillDelta: contract.defaults.maximumSkillDelta,
      skillExpansionPer30Seconds: contract.defaults.skillExpansionPer30Seconds,
      exampleSkillDeltaAfter60Seconds: policy.allowedSkillDelta(60),
    });
    return true;
  }

  const ticket = path.match(/^\/v1\/dev\/matchmaking-authority\/tickets\/([^/]+)$/);
  if (ticket && request.method === "GET") {
    const state = matchmaking.getTicket(decodeURIComponent(ticket[1]));
    sendJson(response, state ? 200 : 404, state || { error: "matchmaking_ticket_not_found" });
    return true;
  }
  if (ticket && request.method === "DELETE") {
    const result = matchmaking.cancel(decodeURIComponent(ticket[1]));
    sendJson(response, result.ok ? 200 : 400, result.ok ? result.ticket : { error: result.error });
    return true;
  }

  const assignment = path.match(/^\/v1\/dev\/matchmaking-authority\/matches\/([^/]+)$/);
  if (assignment && request.method === "GET") {
    const state = matchmaking.getAssignment(decodeURIComponent(assignment[1]));
    sendJson(response, state ? 200 : 404, state || { error: "matchmaking_assignment_not_found" });
    return true;
  }

  return false;
}
