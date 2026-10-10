import { readFileSync } from "node:fs";

export const productGovernanceRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/product-governance-runtime.json", import.meta.url), "utf8")
);
