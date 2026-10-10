import test from "node:test";
import assert from "node:assert/strict";
import { makeServer } from "../src/server.mjs";

async function withServer(run) {
  const server = makeServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test("health, modes and committed platforms are exposed", async () => {
  await withServer(async base => {
    const healthResponse = await fetch(`${base}/health`);
    assert.equal(healthResponse.status, 200);
    assert.equal((await healthResponse.json()).productionReady, false);

    const modesResponse = await fetch(`${base}/v1/modes`);
    const catalog = await modesResponse.json();
    assert.equal(modesResponse.status, 200);
    assert.equal(catalog.sections.length, 4);
    assert.equal(catalog.status, "planned-not-implemented");

    const platformsResponse = await fetch(`${base}/v1/platforms`);
    const platforms = await platformsResponse.json();
    assert.equal(platformsResponse.status, 200);
    assert.deepEqual(
      platforms.committedTargets.map(item => item.id),
      ["android", "ios", "windows"],
    );
  });
});

test("status is explicit about unfinished authentication and multiplayer", async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/v1/status`);
    const status = await response.json();

    assert.equal(response.status, 200);
    assert.equal(status.productionReady, false);
    assert.equal(status.authentication, "not-implemented");
    assert.equal(status.multiplayer, "not-implemented");
  });
});

test("unknown routes return JSON 404", async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/does-not-exist`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "not_found" });
  });
});
