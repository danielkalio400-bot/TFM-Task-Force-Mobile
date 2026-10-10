import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {waypointDirection as direction,
 OfflineWaypointTimingReference as Course}
 from "../src/services/offline-waypoint-timing-reference.mjs";

test("cardinal directions and distances use authored planar coordinates only",()=>{
 assert.equal(direction({x:0,z:0},{x:9,z:1}).direction,"E");
 assert.equal(direction({x:0,z:0},{x:-9,z:1}).direction,"W");
 assert.equal(direction({x:0,z:0},{x:0,z:10}).direction,"N");
 assert.equal(direction({x:0,z:0},{x:0,z:-10}).direction,"S");
 assert.equal(direction({x:0,z:0},{x:1,z:1}).direction,"HERE");
 assert.equal(direction({x:0,z:0},{x:5,z:0}).distanceMeters,5);
 assert.equal(direction(null,{x:1,z:1}).ok,false);
});
test("course records per-leg elapsed time and only accepted ordered arrivals",()=>{
 const c=new Course(3);
 c.tick(0.2);c.tick(0.2);
 assert.equal(c.arrive(1),false);
 assert.equal(c.arrive(0),true);
 assert.equal(c.snapshot().lastLegSeconds,0.4);
 c.tick(0.2);
 assert.equal(c.arrive(1),true);
 assert.ok(Math.abs(c.snapshot().lastLegSeconds-0.2)<0.0001);
 assert.equal(c.arrive(1),false);
 c.tick(0.2);
 assert.equal(c.arrive(2),true);
 assert.equal(c.snapshot().phase,"Completed");
 assert.equal(c.snapshot().newPersonalBestTime,true);
 assert.equal(c.snapshot().onlineProgression,false);
});
test("only completed attempts can update fastest local course time",()=>{
 const c=new Course(2);
 c.tick(0.2);c.tick(0.2);c.arrive(0);c.arrive(1);
 const old=c.snapshot().fastest;
 c.start();c.tick(0.2);c.tick(0.2);c.tick(0.2);
 c.finish("Cancelled");
 assert.equal(c.snapshot().fastest,old);
 assert.equal(c.snapshot().newPersonalBestTime,false);
 c.start();c.tick(0.2);c.arrive(0);c.arrive(1);
 assert.ok(c.snapshot().fastest<old);
 assert.equal(c.snapshot().newPersonalBestTime,true);
 c.start();
 assert.equal(c.snapshot().lastLegSeconds,0);
 assert.equal(c.snapshot().newPersonalBestTime,false);
});
test("Unity training-yard HUD shows next physical marker and fastest local time",()=>{
 const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
 const read=p=>readFileSync(new URL(p,root),"utf8");
 const round=read("Gameplay/Practice/TFMObjectiveRound.cs");
 const hud=read("Gameplay/Practice/TFMObjectiveRoundHud.cs");
 for(const item of ["NextWaypointDistanceMeters","NextWaypointDirection",
   "LastLegSeconds","NewPersonalBestTime","BestCourseTimeSeconds",
   "PlayerPrefs.SetFloat(BestTimeKey","_awarded.Add(NextWaypointIndex)"])
   assert.ok(round.includes(item),item);
 assert.match(hud,/NextWaypointDistanceMeters/);
 assert.match(hud,/NextWaypointDirection/);
 assert.match(hud,/LastLegSeconds/);
 assert.match(hud,/Screen.safeArea/);
 assert.match(hud,/Local practice only - no online rank/);
});
