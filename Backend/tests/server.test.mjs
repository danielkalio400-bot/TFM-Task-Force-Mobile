import test from "node:test";
import assert from "node:assert/strict";
import { makeServer } from "../src/server.mjs";

test("TFM starter API responds with a health check and four planned sections", async () => {
  const server = makeServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;
    const healthResponse = await fetch(`${base}/health`);
    assert.equal(healthResponse.status, 200);
    assert.equal((await healthResponse.json()).productionReady, false);
    const modesResponse = await fetch(`${base}/v1/modes`);
    const catalog = await modesResponse.json();
    assert.equal(modesResponse.status, 200);
    assert.equal(catalog.sections.length, 4);
    assert.equal(catalog.status, "planned-not-implemented");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});