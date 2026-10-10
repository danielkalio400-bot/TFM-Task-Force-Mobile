import { readJson, sendJson } from "../http/json.mjs";

export async function handleProfileAuthority(
  request,
  response,
  path,
  { profiles, contract }
) {
  if (request.method === "GET" && path === "/v1/runtime/player-profile-authority") {
    sendJson(response, 200, contract);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/player-profiles/link-subject") {
    try {
      const result = profiles.linkExternalSubject(await readJson(request));
      sendJson(response, result.ok ? (result.created ? 201 : 200) : 400, result.ok ? result : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const profile = path.match(/^\/v1\/dev\/player-profiles\/([^/]+)$/);
  if (profile && request.method === "GET") {
    const state = profiles.get(decodeURIComponent(profile[1]));
    sendJson(response, state ? 200 : 404, state || { error: "player_profile_not_found" });
    return true;
  }

  const display = path.match(/^\/v1\/dev\/player-profiles\/([^/]+)\/display-name$/);
  if (display && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = profiles.updateDisplayName(decodeURIComponent(display[1]), body?.displayName);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.profile : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const lifecycle = path.match(/^\/v1\/dev\/player-profiles\/([^/]+)\/lifecycle$/);
  if (lifecycle && request.method === "POST") {
    try {
      const body = await readJson(request);
      const result = profiles.setLifecycleState(decodeURIComponent(lifecycle[1]), body?.state);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.profile : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const audit = path.match(/^\/v1\/dev\/player-profiles\/([^/]+)\/audit$/);
  if (audit && request.method === "GET") {
    const url = new URL(request.url || "/", "http://localhost");
    sendJson(response, 200, {
      events: profiles.audit(decodeURIComponent(audit[1]), url.searchParams.get("limit")),
    });
    return true;
  }

  return false;
}
