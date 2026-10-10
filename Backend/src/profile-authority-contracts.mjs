import { readFileSync } from "node:fs";

export const playerProfileAuthorityRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/player-profile-authority.json", import.meta.url), "utf8")
);
