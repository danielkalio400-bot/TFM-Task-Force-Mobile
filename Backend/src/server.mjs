import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const catalogPath = new URL("../../Shared/contracts/mode-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

export function makeServer() {
  return createServer((request, response) => {
    const path = (request.url || "").split("?")[0];
    const send = (status, payload) => {
      response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify(payload));
    };
    if (request.method === "GET" && path === "/health") {
      return send(200, { ok: true, service: "tfm-api-starter", productionReady: false });
    }
    if (request.method === "GET" && path === "/v1/modes") {
      return send(200, catalog);
    }
    return send(404, { error: "not_found" });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number.parseInt(process.env.PORT || "4100", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  // Local-only by design. Do not expose as a public game service.
  makeServer().listen(port, "127.0.0.1", () => console.log(`TFM starter API: http://127.0.0.1:${port}`));
}