import { readFileSync } from "node:fs";

export const platformComplianceRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/platform-compliance-runtime.json", import.meta.url), "utf8")
);
