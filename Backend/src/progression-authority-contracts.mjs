import { readFileSync } from "node:fs";

export const progressionAuthorityRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/progression-authority-runtime.json", import.meta.url), "utf8")
);
