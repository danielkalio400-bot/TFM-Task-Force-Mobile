import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const source=read("Editor/TFMDistrictLifeBuilder.cs");
const vehicle=read("World/District01/TFMDistrictStreetVehicle.cs");
const signal=read("World/District01/TFMDistrictTrafficSignal.cs");
const daylight=read("World/District01/TFMDistrictDaylight.cs");
const manifest=read("TFM-Source-Manifest.txt");
const script=readFileSync(new URL("../../Build-TFM-District.ps1",import.meta.url),"utf8");
test("Bulk 63 real Unity scene expansion is additive and idempotent",()=>{
 for(const name of ["Editor/TFMDistrictLifeBuilder.cs","World/District01/TFMDistrictStreetVehicle.cs",
  "World/District01/TFMDistrictTrafficSignal.cs","World/District01/TFMDistrictDaylight.cs"])
    assert.equal(manifest.split(/\r?\n/).filter(x=>x===name).length,1,name);
 assert.match(source,/TFMDistrictWorldBuilder\.DistrictScene/);
 assert.match(source,/TFM District 01 - Street Life Bulk 63/);
 assert.match(source,/if \(existing != null\)/);
 assert.match(source,/EditorSceneManager\.SaveScene\(scene\)/);
 assert.match(source,/GetComponent<TFMDistrictDaylight>|AddComponent<TFMDistrictDaylight>/);
 assert.match(source,/AssetDatabase\.LoadAssetAtPath<Material>/);
 assert.doesNotMatch(source,/AssetDatabase\.DeleteAsset|SaveScene\(source|DestroyImmediate\(root/);
 assert.match(script,/TFM\.Editor\.TFMDistrictLifeBuilder\.ExpandBatch/);
 assert.match(script,/TFM_DISTRICT_LIFE_RESULT=SUCCESS/);
});
test("traffic vehicles obey crossroads and react to physical obstacles",()=>{
 assert.match(source,/new Vector3\(-49f, 0f, 20\.5f\)/);
 assert.match(source,/new Vector3\(-3\.2f, 0f, -49f\)/);
 assert.match(vehicle,/Physics\.RaycastNonAlloc/);
 assert.match(vehicle,/redAhead \|\| blocked/);
 assert.match(vehicle,/signal\.NorthSouthGreen/);
 assert.match(vehicle,/signal\.EastWestGreen/);
 assert.match(vehicle,/Mathf\.MoveTowards/);
 assert.match(signal,/NorthSouthGreen/);
 assert.match(signal,/EastWestGreen/);
 assert.match(signal,/MaterialPropertyBlock/);
});
test("environment cycles sun and avoids expensive per-lamp shadow lights",()=>{
 assert.match(daylight,/RenderSettings\.ambientMode = AmbientMode\.Trilight/);
 assert.match(daylight,/dayLengthSeconds/);
 assert.match(daylight,/LightType\.Directional/);
 assert.match(source,/Street Trees and Planters/);
 assert.match(source,/22 roadside trees/);
 assert.doesNotMatch(source,/new Material\((?!shader)/);
});

test("cross-street actors avoid original north-side industrial facade collisions",()=>{
 assert.match(source,/new Vector3\(-49f, 0f, 20\.5f\)/);
 assert.doesNotMatch(source,/new Vector3\(49f, 0f, 26\.5f\)/);
 assert.match(source,/Northbound Courier Car/);
});
