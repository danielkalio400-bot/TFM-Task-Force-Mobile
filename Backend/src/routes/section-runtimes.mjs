import { readJson, sendJson } from "../http/json.mjs";

export async function handleSectionRuntimes(
  request,
  response,
  path,
  { sections, battleRoyale, coop, extraction }
) {
  if (request.method === "GET" && path === "/v1/sections") {
    sendJson(response, 200, sections);
    return true;
  }

  if (request.method === "POST" && path === "/v1/dev/br-runtimes") {
    try {
      const result = battleRoyale.create(await readJson(request));
      sendJson(response, 201, result.runtime);
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const br = path.match(/^\/v1\/dev\/br-runtimes\/([^/]+)\/advance$/);
  if (request.method === "POST" && br) {
    try {
      const body = await readJson(request);
      const result = battleRoyale.advance(decodeURIComponent(br[1]), body?.seconds);
      sendJson(response, result.ok ? 200 : 404, result.ok ? result.runtime : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/coop-runtimes") {
    try {
      const result = coop.create(await readJson(request));
      sendJson(response, 201, result.runtime);
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const coopObjective = path.match(/^\/v1\/dev\/coop-runtimes\/([^/]+)\/objective$/);
  if (request.method === "POST" && coopObjective) {
    try {
      const body = await readJson(request);
      const result = coop.completeObjective(decodeURIComponent(coopObjective[1]), body?.amount);
      sendJson(response, result.ok ? 200 : 404, result.ok ? result.runtime : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const coopWave = path.match(/^\/v1\/dev\/coop-runtimes\/([^/]+)\/next-wave$/);
  if (request.method === "POST" && coopWave) {
    try {
      const body = await readJson(request);
      const result = coop.advanceWave(decodeURIComponent(coopWave[1]), body?.nextObjectiveCount);
      sendJson(response, result.ok ? 200 : 400, result.ok ? result.runtime : { error: result.error });
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  if (request.method === "POST" && path === "/v1/dev/extraction-runtimes") {
    try {
      const result = extraction.create(await readJson(request));
      sendJson(response, 201, result.runtime);
      return true;
    } catch (error) {
      sendJson(response, 400, { error: error?.code || "invalid_request" });
      return true;
    }
  }

  const contract = path.match(/^\/v1\/dev\/extraction-runtimes\/([^/]+)\/contract$/);
  if (request.method === "POST" && contract) {
    const result = extraction.completeContract(decodeURIComponent(contract[1]));
    sendJson(response, result.ok ? 200 : 404, result.ok ? result.runtime : { error: result.error });
    return true;
  }

  const extract = path.match(/^\/v1\/dev\/extraction-runtimes\/([^/]+)\/extract$/);
  if (request.method === "POST" && extract) {
    const result = extraction.extract(decodeURIComponent(extract[1]));
    sendJson(response, result.ok ? 200 : 400, result.ok ? result.runtime : { error: result.error });
    return true;
  }

  return false;
}
