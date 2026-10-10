// Deterministic non-authoritative reference of the Unity target practice
// analytics. No online identities, rewards, grants or leaderboards.
export class OfflineTrainingAnalyticsReference {
  constructor(totalTargets=3) {
    if(!Number.isSafeInteger(totalTargets)||totalTargets<1||totalTargets>100)
      throw new Error("invalid_training_target_count");
    this.totalTargets=totalTargets;
    this.begin();
  }
  begin(){
    this.phase="Running";
    this.shots=0;this.hits=0;this.misses=0;
    this.streak=0;this.longestStreak=0;
    this.cleared=new Set();
    return this.snapshot();
  }
  shot({targetIndex,hit,targetCleared}={}){
    if(this.phase!=="Running")return {ok:false,error:"not_running"};
    this.shots++;
    const valid=hit===true && Number.isInteger(targetIndex) &&
      targetIndex>=0 && targetIndex<this.totalTargets &&
      !this.cleared.has(targetIndex);
    if(valid){
      this.hits++;this.streak++;
      this.longestStreak=Math.max(this.longestStreak,this.streak);
      if(targetCleared===true){
        this.cleared.add(targetIndex);
        if(this.cleared.size===this.totalTargets)this.phase="Completed";
      }
    }else {
      this.misses++;this.streak=0;
    }
    return {ok:true,...this.snapshot()};
  }
  finish(phase="Expired"){
    if(this.phase!=="Running")return {ok:false,error:"not_running"};
    if(phase!=="Expired"&&phase!=="Cancelled")
      return {ok:false,error:"invalid_end"};
    this.phase=phase;
    return {ok:true,...this.snapshot()};
  }
  snapshot(){
    const accuracy=this.shots>0?this.hits/this.shots:0;
    const medal=this.phase!=="Completed"?"None":
      accuracy>=0.9&&this.longestStreak>=this.totalTargets?"Gold":
      accuracy>=0.7?"Silver":"Bronze";
    return {phase:this.phase,shotsFired:this.shots,shotsHit:this.hits,
      shotsMissed:this.misses,currentHitStreak:this.streak,
      longestHitStreak:this.longestStreak,clearedTargets:this.cleared.size,
      totalTargets:this.totalTargets,accuracy,medal,grantsProgression:false};
  }
}
