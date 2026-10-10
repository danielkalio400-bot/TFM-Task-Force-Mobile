import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { offlineTrainingTrial } from "../src/offline-training-contracts.mjs";

const root = new URL("../../GameClient/StarterAssets/Assets/_TFM/", import.meta.url);
function source(path) { return readFileSync(new URL(path, root), "utf8"); }

test("training trial remains local and cannot grant online progress", () => {
  assert.deepEqual(offlineTrainingTrial.platforms, ["Android","iOS","Windows"]);
  assert.equal(offlineTrainingTrial.integrity.authoritative, false);
  assert.equal(offlineTrainingTrial.integrity.grantsProgression, false);
  assert.equal(offlineTrainingTrial.integrity.serverLeaderboard, false);
  assert.equal(offlineTrainingTrial.trial.targets, 3);
});

test("existing scene bootstraps trial without regenerating saved geometry", () => {
  const boot = source("Gameplay/Prototype/TFMPrototypeBootstrap.cs");
  assert.match(boot, /if \(sceneBuilt\) return/);
  assert.match(boot, /GetComponent<TFMTrainingTrial>/);
  assert.match(boot, /GetComponentsInChildren<TFMTargetDummy>\(true\)/);
  assert.match(boot, /trialHud.Configure\(trial\)/);
});
test("shots are recorded only from real weapon events and target clear events", () => {
  const weapon = source("Gameplay/Combat/TFMHitscanWeapon.cs");
  const dummy = source("Gameplay/Combat/TFMTargetDummy.cs");
  assert.match(weapon, /TrainingShotResolved\?\.Invoke/);
  assert.match(weapon, /practiceTargetCleared = !target.IsAlive/);
  assert.match(dummy, /ResetForTrial/);
  assert.match(dummy, /StopAllCoroutines\(\)/);
});
test("trial tracks timing, accuracy, target uniqueness and restart", () => {
  const trial = source("Gameplay/Training/TFMTrainingTrial.cs");
  for (const phrase of [
    "HashSet<TFMTargetDummy>", "Time.unscaledDeltaTime", "_remaining.Remove(result.Target)",
    "ShotsHit", "ShotsFired", "ResetForTrial()", "ResetTrainingAmmo()",
    "LocalBestKey", "TFMTrainingTrialPhase.Expired", "TFMTrainingTrialPhase.Completed"
  ]) assert.ok(trial.includes(phrase), phrase);
  assert.match(trial, /OnApplicationFocus\(bool focused\)/);
  assert.match(trial, /if \(_weapon != null\) _weapon.TrainingShotResolved -= OnTrainingShot/);
});
test("mobile debug trial HUD respects screen safe area", () => {
  const hud = source("Gameplay/Training/TFMTrainingTrialHud.cs");
  assert.match(hud, /Screen.safeArea/);
  assert.match(hud, /Start \/ retry/);
  assert.match(hud, /End trial/);
  assert.match(hud, /trial.Begin\(\)/);
});
