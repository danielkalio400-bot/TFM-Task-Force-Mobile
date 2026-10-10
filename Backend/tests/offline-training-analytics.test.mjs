import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {OfflineTrainingAnalyticsReference as Drill}
 from "../src/services/offline-training-analytics-reference.mjs";

test("genuine target events produce correct hits, misses and precision medal",()=>{
 const drill=new Drill(3);
 drill.shot({hit:true,targetIndex:0,targetCleared:true});
 drill.shot({hit:true,targetIndex:1,targetCleared:true});
 const completed=drill.shot({hit:true,targetIndex:2,targetCleared:true});
 assert.equal(completed.phase,"Completed");
 assert.equal(completed.shotsHit,3);
 assert.equal(completed.shotsMissed,0);
 assert.equal(completed.longestHitStreak,3);
 assert.equal(completed.medal,"Gold");
 assert.equal(completed.grantsProgression,false);
 assert.equal(drill.shot({hit:true,targetIndex:0}).error,"not_running");
});
test("missing shots and already-cleared targets break streak instead of farming hits",()=>{
 const drill=new Drill(2);
 drill.shot({hit:true,targetIndex:0,targetCleared:true});
 drill.shot({hit:true,targetIndex:0,targetCleared:true});
 let state=drill.snapshot();
 assert.equal(state.shotsHit,1);
 assert.equal(state.shotsMissed,1);
 assert.equal(state.currentHitStreak,0);
 state=drill.shot({hit:true,targetIndex:1,targetCleared:true});
 assert.equal(state.medal,"Bronze");
 assert.equal(state.shotsHit+state.shotsMissed,state.shotsFired);
});
test("silver, cancelled, expired and retry states remain local",()=>{
 const drill=new Drill(2);
 drill.shot({hit:true,targetIndex:0,targetCleared:false});
 drill.shot({hit:false});
 drill.shot({hit:true,targetIndex:0,targetCleared:true});
 drill.shot({hit:true,targetIndex:1,targetCleared:true});
 assert.equal(drill.snapshot().accuracy,0.75);
 assert.equal(drill.snapshot().medal,"Silver");
 const fresh=drill.begin();
 assert.equal(fresh.shotsFired,0);
 assert.equal(fresh.longestHitStreak,0);
 assert.equal(drill.finish("Cancelled").medal,"None");
 drill.begin();
 assert.equal(drill.finish("Expired").medal,"None");
});
test("Unity target analytics are driven by actual weapon events and drawn in offline HUD",()=>{
 const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
 const read=path=>readFileSync(new URL(path,root),"utf8");
 const trial=read("Gameplay/Training/TFMTrainingTrial.cs");
 assert.match(trial,/result.Hit && result.Target != null/);
 assert.match(trial,/_remaining.Contains\(result.Target\)/);
 assert.match(trial,/ShotsMissed\+\+/);
 assert.match(trial,/CurrentHitStreak = 0/);
 assert.match(trial,/LongestHitStreak = Mathf.Max/);
 assert.match(trial,/ShotsFired = ShotsHit = ShotsMissed = 0/);
 assert.match(trial,/if \(Phase != TFMTrainingTrialPhase.Completed\) return "None"/);
 const hud=read("Gameplay/Training/TFMTrainingTrialHud.cs");
 assert.match(hud,/trial.ShotsMissed/);
 assert.match(hud,/trial.LongestHitStreak/);
 assert.match(hud,/trial.PracticeMedal/);
 assert.match(read("Gameplay/Combat/TFMHitscanWeapon.cs"),/TrainingShotResolved\?\.Invoke/);
});
