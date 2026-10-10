import { readFileSync } from "node:fs";

export const operationsReliabilityRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/operations-reliability-runtime.json", import.meta.url), "utf8")
);
