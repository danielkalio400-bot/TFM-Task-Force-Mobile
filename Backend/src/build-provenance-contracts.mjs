import { readFileSync } from "node:fs";

export const buildProvenanceRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/build-provenance-runtime.json", import.meta.url), "utf8")
);
