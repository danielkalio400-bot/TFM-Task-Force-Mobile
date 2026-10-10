import { readFileSync } from "node:fs";

export const bazIdAuthBoundary = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/bazid-auth-boundary.json", import.meta.url), "utf8")
);
