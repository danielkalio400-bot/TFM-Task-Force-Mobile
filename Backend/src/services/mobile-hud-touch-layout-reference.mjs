// Geometry reference for the original Unity development HUD. All action
// controls and gesture exclusion zones share the same safe-area coordinates.
const scale=safe=>Math.max(.60,Math.min(1.30,Math.min(safe.width/850,safe.height/390)));
export function mobileHudRegions(safe,screenHeight){
 if(!safe || ![safe.x,safe.y,safe.width,safe.height,screenHeight].every(Number.isFinite) ||
 safe.width<=0||safe.height<=0||screenHeight<=0 || safe.y<0 ||
 safe.y+safe.height>screenHeight)return {ok:false,error:"invalid_safe_area"};
 const s=scale(safe),left=safe.x,right=safe.x+safe.width;
 const top=screenHeight-safe.y-safe.height,bottom=top+safe.height;
 const rect=(x,y,w,h)=>({x,y,w,h});
 return {ok:true,scale:s,safeTop:top,
  fire:rect(right-118*s,bottom-260*s,104*s,78*s),
  jump:rect(right-245*s,bottom-145*s,96*s,64*s),
  reload:rect(right-245*s,bottom-225*s,96*s,54*s),
  move:rect(left+20*s,bottom-165*s,145*s,130*s),
  look:rect(right-165*s,top+safe.height/2-65*s,145*s,130*s)};
}
export function isActionButtonTouch(point,safe,screenHeight){
 const p=mobileHudRegions(safe,screenHeight);
 if(!p.ok||!point||![point.x,point.y].every(Number.isFinite))
 return false;
 if(point.x<safe.x||point.x>safe.x+safe.width||
 point.y<safe.y||point.y>safe.y+safe.height)return false;
 const guiY=screenHeight-point.y,margin=p.scale*9;
 return [p.fire,p.jump,p.reload].some(r=>
 point.x>=r.x-margin&&point.x<=r.x+r.w+margin&&
 guiY>=r.y-margin&&guiY<=r.y+r.h+margin);
}
