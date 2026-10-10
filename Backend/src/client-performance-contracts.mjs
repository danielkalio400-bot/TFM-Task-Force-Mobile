import { readFileSync } from "node:fs";

export const clientAdaptivePerformance = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/client-adaptive-performance.json", import.meta.url), "utf8")
);
