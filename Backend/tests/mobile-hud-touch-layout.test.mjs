import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {mobileHudRegions,isActionButtonTouch}
 from "../src/services/mobile-hud-touch-layout-reference.mjs";
const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const src=p=>readFileSync(new URL(p,root),"utf8");

test("action-button regions remain inside common phone/tablet landscape safe areas",()=>{
 for(const [w,h,insetX,insetY] of [[800,400,25,10],[1280,800,40,20],[1024,768,0,0]]){
  const safe={x:insetX,y:insetY,width:w-2*insetX,height:h-2*insetY};
  const p=mobileHudRegions(safe,h);
  assert.equal(p.ok,true);
  for(const key of ["fire","jump","reload","move","look"]){
   const r=p[key];
   assert.ok(r.x>=safe.x,key+" xStart");
   assert.ok(r.x+r.w<=safe.x+safe.width,key+" xEnd");
   assert.ok(r.y>=h-safe.y-safe.height,key+" yStart");
   assert.ok(r.y+r.h<=h-safe.y,key+" yEnd");
  }
  for(const key of ["fire","jump","reload"]){
   const r=p[key],point={x:r.x+r.w/2,y:h-(r.y+r.h/2)};
   assert.equal(isActionButtonTouch(point,safe,h),true,key);
  }
 }
});
test("touch exclusion does not consume look and movement gestures or outside-inset taps",()=>{
 const safe={x:30,y:12,width:940,height:520},height=544;
 assert.equal(isActionButtonTouch({x:100,y:300},safe,height),false);
 assert.equal(isActionButtonTouch({x:520,y:250},safe,height),false);
 assert.equal(isActionButtonTouch({x:12,y:20},safe,height),false);
 assert.equal(mobileHudRegions({x:0,y:-1,width:100,height:100},200).ok,false);
});
test("Unity action and gesture paths reference one safe-area layout source",()=>{
 const controls=src("Player/Controls/TFMPlayerInput.cs");
 const hud=src("UI/HUD/TFMPrototypeHud.cs");
 const layout=src("Player/Controls/TFMMobileControlLayout.cs");
 assert.match(controls,/TFMMobileControlLayout.IsActionTouch/);
 assert.match(controls,/!Application.isMobilePlatform && Input.GetMouseButton\(0\)/);
 assert.match(controls,/mouse != null && !Application.isMobilePlatform/);
 assert.match(controls,/ResetTransientInput\(\)/);
 assert.match(controls,/touchLookSensitivity/);
 for(const method of ["Fire","Jump","Reload","MoveZone","LookZone"])
   assert.ok(hud.includes("TFMMobileControlLayout."+method+"("),method);
 assert.match(layout,/screenHeight - bottomLeftPosition.y/);
 assert.match(layout,/GuiSafeArea/);
 assert.doesNotMatch(controls,/IsMobileButtonZone/);
});
