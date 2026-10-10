import { readFileSync } from "node:fs";

function load(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}

export const contentCompatibility = load("../../Shared/contracts/content-compatibility.json");
export const mapReadinessContract = load("../../Shared/contracts/map-readiness.json");
