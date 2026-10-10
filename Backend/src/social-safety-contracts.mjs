import { readFileSync } from "node:fs";

export const socialSafetyRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/social-safety-runtime.json", import.meta.url), "utf8")
);
