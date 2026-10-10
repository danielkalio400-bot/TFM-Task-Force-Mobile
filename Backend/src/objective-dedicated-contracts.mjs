import {readFileSync} from "node:fs";
export const objectiveDedicatedContract=JSON.parse(readFileSync(
  new URL("../../Shared/contracts/objective-dedicated-session-bridge.json",import.meta.url),"utf8"
));
