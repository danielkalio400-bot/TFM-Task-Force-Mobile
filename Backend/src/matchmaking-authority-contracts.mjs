import { readFileSync } from "node:fs";

export const matchmakingAuthorityRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/matchmaking-authority-runtime.json", import.meta.url), "utf8")
);
