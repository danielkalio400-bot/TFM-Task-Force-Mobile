import { readFileSync } from "node:fs";

function load(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}

export const originalMapCatalog = load("../../Shared/contracts/original-map-catalog.json");
export const contentPackCatalog = load("../../Shared/contracts/content-pack-catalog.json");
