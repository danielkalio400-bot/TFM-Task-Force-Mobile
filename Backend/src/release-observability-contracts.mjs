import { readFileSync } from "node:fs";

export const releaseObservabilityRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/release-observability-runtime.json", import.meta.url), "utf8")
);
