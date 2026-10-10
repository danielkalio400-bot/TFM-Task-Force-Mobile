import { readFileSync } from "node:fs";

export const productionTelemetryGates = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/production-telemetry-gates.json", import.meta.url), "utf8")
);
