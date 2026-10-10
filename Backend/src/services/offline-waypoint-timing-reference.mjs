// Offline reference to the TFM training yard's authored waypoint-course
// direction and split times. Straight-line guidance only; no real road data.
export function waypointDirection(origin,target,radius=1.8){
 if(!origin||!target||![origin.x,origin.z,target.x,target.z,radius]
   .every(Number.isFinite)||radius<0.5||radius>20)
   return {ok:false,error:"invalid_waypoint_position"};
 const dx=target.x-origin.x,dz=target.z-origin.z;
 const distance=Math.hypot(dx,dz);
 const direction=distance<=radius?"HERE":
   Math.abs(dx)>Math.abs(dz)?(dx>=0?"E":"W"):(dz>=0?"N":"S");
 return {ok:true,distanceMeters:distance,direction,
   withinReach:distance<=radius};
}
export class OfflineWaypointTimingReference{
 constructor(count=5){
  if(!Number.isInteger(count)||count<1||count>50)
   throw new Error("invalid_waypoint_count");
  this.count=count;this.fastest=0;this.start();
 }
 start(){
  this.phase="Active";this.elapsed=0;this.index=0;
  this.lastArrival=0;this.lastLegSeconds=0;
  this.newPersonalBestTime=false;return this.snapshot();
 }
 tick(seconds){
  if(this.phase!=="Active")return this.snapshot();
  if(!Number.isFinite(seconds)||seconds<0||seconds>0.2)
   throw new Error("invalid_offline_tick");
  this.elapsed+=seconds;return this.snapshot();
 }
 arrive(index){
  if(this.phase!=="Active"||index!==this.index)return false;
  this.lastLegSeconds=Math.max(0,this.elapsed-this.lastArrival);
  this.lastArrival=this.elapsed;this.index++;
  if(this.index===this.count){
   this.phase="Completed";
   if(this.elapsed>0&&(this.fastest===0||this.elapsed<this.fastest)){
    this.fastest=this.elapsed;this.newPersonalBestTime=true;
   }
  }
  return true;
 }
 finish(reason="Cancelled"){
  if(this.phase==="Active"&&["Cancelled","Expired"].includes(reason))
   this.phase=reason;
  return this.snapshot();
 }
 snapshot(){
  return {phase:this.phase,completedWaypoints:this.index,
    lastLegSeconds:this.lastLegSeconds,fastest:this.fastest,
    newPersonalBestTime:this.newPersonalBestTime,elapsed:this.elapsed,
    onlineProgression:false};
 }
}
