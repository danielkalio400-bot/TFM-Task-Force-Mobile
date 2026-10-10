import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clientAdaptivePerformance } from "../src/client-performance-contracts.mjs";

const directory = new URL("../../GameClient/StarterAssets/Assets/_TFM/Performance/", import.meta.url);
const read = name => readFileSync(new URL(name, directory), "utf8");

test("mobile and PC frame-rate contract specifies a measured hardware ceiling", () => {
  assert.deepEqual(clientAdaptivePerformance.platforms, ["Android", "iOS", "Windows"]);
  assert.equal(clientAdaptivePerformance.targetFps.floor, 30);
  assert.match(clientAdaptivePerformance.targetFps.ceiling, /no artificial maximum/);
  assert.deepEqual(clientAdaptivePerformance.policy.presets, ["BatterySaver","Balanced","Performance","Adaptive"]);
});

test("Unity runtime uses sustained frame pacing, cooldown and conservative probes", () => {
  const runtime = read("TFMAdaptiveFramePacer.cs");
  assert.match(runtime, /Time\.unscaledDeltaTime/);
  assert.match(runtime, /ScalableBufferManager\.ResizeBuffers/);
  assert.match(runtime, /_cooldownWindows/);
  assert.match(runtime, /SlowFrameAllowance/);
  assert.match(runtime, /Application\.targetFrameRate/);
  assert.match(runtime, /Screen\.currentResolution\.refreshRateRatio/);
  assert.match(runtime, /_renderScale = Mathf\.Max/);
});

test("quality policy selects actual display divisors without 120/144 hard cap", () => {
  const policy = read("TFMFrameRatePolicy.cs");
  assert.match(policy, /refreshHz % divisor != 0/);
  assert.match(policy, /SupportedTargets/);
  assert.match(policy, /NextHigher/);
  assert.match(policy, /NextLower/);
  assert.doesNotMatch(policy, /Math\.Min\(refreshHz, 120\)/);
  assert.match(clientAdaptivePerformance.dataBoundary, /never authorize score/);
});

test("development UI has adjustable cap and safe-area positioning", () => {
  const panel = read("TFMPerformancePanel.cs");
  assert.match(panel, /Screen\.safeArea/);
  assert.match(panel, /SetMode/);
  assert.match(panel, /SetFrameRateCap/);
  assert.match(panel, /ENABLE_INPUT_SYSTEM/);
});

test("runtime bootstrap installs quality controls for already-generated scenes", () => {
  const bootstrap = readFileSync(new URL("../../GameClient/StarterAssets/Assets/_TFM/Gameplay/Prototype/TFMPrototypeBootstrap.cs", import.meta.url), "utf8");
  assert.match(bootstrap, /GetComponent<TFMAdaptiveFramePacer>/);
  assert.match(bootstrap, /AddComponent<TFMPerformancePanel>/);
});
