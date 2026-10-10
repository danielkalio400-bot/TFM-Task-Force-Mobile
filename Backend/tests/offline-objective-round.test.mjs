import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LocalObjectiveRound } from "../src/services/local-objective-round.mjs";
import { offlineObjectiveCourse } from "../src/offline-objective-contracts.mjs";

const root = new URL("../../GameClient/StarterAssets/Assets/_TFM/", import.meta.url);
const read = relative => readFileSync(new URL(relative, root), "utf8");
test("offline objective reference completes only ordered waypoints", () => {
  const round = new LocalObjectiveRound();
  assert.equal(round.begin().phase, "Active");
  assert.equal(round.arrive(1), false);
  assert.equal(round.arrive(0), true);
  assert.equal(round.arrive(0), false);
  for (let i=1;i<5;i++) assert.equal(round.arrive(i),true);
  assert.equal(round.snapshot().phase,"Completed");
  assert.ok(round.snapshot().score>=500);
  assert.equal(round.arrive(4),false);
  const best=round.snapshot().localBest;
  round.begin();
  assert.equal(round.snapshot().score,0);
  assert.equal(round.snapshot().localBest,best);
});
test("timing, app background and cancelled rounds", () => {
  const round=new LocalObjectiveRound({count:2,timeLimitSeconds:1});
  round.begin();
  round.tick(0.2,{focused:false});
  assert.equal(round.snapshot().remainingSeconds,1);
  assert.throws(()=>round.tick(300),/invalid_offline_tick/);
  for(let i=0;i<5;i++) round.tick(0.2);
  assert.equal(round.snapshot().phase,"Expired");
  assert.equal(round.arrive(0),false);
  round.begin();round.cancel();
  assert.equal(round.snapshot().phase,"Cancelled");
  assert.equal(round.arrive(0),false);
});
test("Unity course is runtime installed and never overwrites original scene", () => {
  const builder=read("Gameplay/Practice/TFMObjectiveCourseBuilder.cs");
  const bootstrap=read("Gameplay/Prototype/TFMPrototypeBootstrap.cs");
  assert.match(builder,/Waypoint \" \+ \(i \+ 1\)/);
  assert.match(builder,/Object.Destroy\(collider\)/);
  assert.match(bootstrap,/TFMObjectiveCourseBuilder.Build/);
  assert.match(bootstrap,/course.Configure/);
  assert.match(bootstrap,/GetComponent<TFMObjectiveRound>/);
});
test("Unity rounds integrate training mode exclusivity and safe-area HUD", () => {
  const trial=read("Gameplay/Training/TFMTrainingTrial.cs");
  const round=read("Gameplay/Practice/TFMObjectiveRound.cs");
  const hud=read("Gameplay/Practice/TFMObjectiveRoundHud.cs");
  assert.match(round,/training.Cancel\(\)/);
  assert.match(trial,/route.Cancel\(\)/);
  assert.match(round,/Time.unscaledDeltaTime/);
  assert.match(round,/NextWaypointIndex\+\+/);
  assert.match(hud,/Screen.safeArea/);
  assert.equal(offlineObjectiveCourse.authority.offlineOnly,true);
  assert.equal(offlineObjectiveCourse.authority.progression,false);
});
