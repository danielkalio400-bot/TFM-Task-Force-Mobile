import { readFileSync } from "node:fs";

function load(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}

export const contentDeliveryContract = load("../../Shared/contracts/content-delivery.json");
export const releaseReadinessContract = load("../../Shared/contracts/release-readiness.json");
