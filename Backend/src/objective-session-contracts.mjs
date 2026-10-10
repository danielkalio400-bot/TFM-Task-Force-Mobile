import { readFileSync } from "node:fs";
export const objectiveSessionContract=JSON.parse(
  readFileSync(new URL("../../Shared/contracts/objective-session-issuer.json",import.meta.url),"utf8")
);
