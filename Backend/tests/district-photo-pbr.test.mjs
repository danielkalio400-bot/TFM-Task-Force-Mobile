import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../../GameClient/StarterAssets/Assets/_TFM/",import.meta.url);
const read=x=>readFileSync(new URL(x,root),"utf8");
const editor=read("Editor/TFMDistrictPbrImporter.cs");
const manifest=read("TFM-Source-Manifest.txt");
const downloader=readFileSync(new URL("../../Import-TFM-PBR.ps1",import.meta.url),"utf8");
const world=readFileSync(new URL("../../Build-TFM-District.ps1",import.meta.url),"utf8");
test("photographed CC0 importer is managed exactly once and packs URP roughness correctly",()=>{
 assert.equal(manifest.split(/\r?\n/).filter(x=>x==="Editor/TFMDistrictPbrImporter.cs").length,1);
 assert.match(editor,/TextureImporterType\.NormalMap/);
 assert.match(editor,/1f - Mathf\.Clamp01\(pixels\[i\]\.grayscale\)/);
 assert.match(editor,/_MetallicGlossMap/);
 assert.match(editor,/AssetDatabase\.SaveAssets\(\)/);
 assert.doesNotMatch(editor,/AssetDatabase\.DeleteAsset/);
});
test("real photo URLs come only from CC0 provider metadata and preserve credit",()=>{
 assert.match(downloader,/api\.polyhaven\.com\/search/);
 assert.match(downloader,/api\.polyhaven\.com\/files/);
 assert.match(downloader,/Powered by Poly Haven/);
 assert.match(downloader,/PolyHaven-Provenance\.json/);
 assert.match(downloader,/license='CC0'/);
 assert.match(world,/Import-TFM-PBR\.ps1/);
});

test("PBR Windows PowerShell 5.1 serialization uses strongly-typed array, not generic collection array literal",()=>{
 assert.match(downloader,/\$provenance = \$ledger\.ToArray\(\)/);
 assert.match(downloader,/ConvertTo-Json -InputObject \$provenance/);
 assert.doesNotMatch(downloader,/@\(\$ledger\)/);
 assert.match(downloader,/Reusing downloaded photographed PBR maps/);
});
