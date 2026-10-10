import { readFileSync } from "node:fs";
export const serverObjectiveRoundsContract = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/server-objective-rounds.json",import.meta.url),"utf8")
);
