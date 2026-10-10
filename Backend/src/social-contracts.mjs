import { readFileSync } from "node:fs";

export const socialPrivacyRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/social-privacy-runtime.json", import.meta.url), "utf8")
);
