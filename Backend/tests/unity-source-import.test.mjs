import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const root = fileURLToPath(new URL("../../GameClient/StarterAssets/Assets/_TFM/", import.meta.url));
function walk(folder) {
  return readdirSync(folder,{withFileTypes:true}).flatMap(item => {
    const path=join(folder,item.name);
    return item.isDirectory() ? walk(path) : item.isFile() && item.name.endsWith(".cs") ?
      [relative(root,path).replaceAll("\\","/")] : [];
  });
}
test("Unity updater manifest is complete and includes new training/performance sources",()=>{
 const expected=walk(root).sort();
 const manifest=readFileSync(join(root,"TFM-Source-Manifest.txt"),"utf8")
   .split(/\r?\n/).map(s=>s.trim()).filter(s=>s && !s.startsWith("#")).sort();
 assert.deepEqual(manifest,expected);
 assert.ok(expected.includes("Gameplay/Training/TFMTrainingTrial.cs"));
 assert.ok(expected.includes("Performance/TFMAdaptiveFramePacer.cs"));
});
test("Windows updater no longer produces in-repo backups or relies on hard-coded 10 scripts",()=>{
 const updater=readFileSync(new URL("../../Update-TFM-Unity.ps1",import.meta.url),"utf8");
 assert.match(updater,/Parse-Manifest/);
 assert.match(updater,/TFM-Source-Manifest\.txt/);
 assert.match(updater,/ForceManagedOverwrite/);
 assert.match(updater,/Get-FileHash/);
 assert.doesNotMatch(updater,/Join-Path \$Root \('backups\//);
 assert.doesNotMatch(updater,/\$required = @\(/);
});
