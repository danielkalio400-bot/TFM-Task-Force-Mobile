const DEFAULT_LIMIT = 32 * 1024;

export function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

export async function readJson(request, limitBytes = DEFAULT_LIMIT) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > limitBytes) {
      const error = new Error("request_too_large");
      error.code = "request_too_large";
      throw error;
    }
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf8").trim();
  if (!body) {
    const error = new Error("empty_json_body");
    error.code = "invalid_json";
    throw error;
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("invalid_json");
    error.code = "invalid_json";
    throw error;
  }
}
