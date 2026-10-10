import {readFileSync} from "node:fs";
export const objectiveServerLeaseContract=JSON.parse(readFileSync(
  new URL("../../Shared/contracts/objective-server-lease-monitor.json",import.meta.url),
  "utf8"
));
