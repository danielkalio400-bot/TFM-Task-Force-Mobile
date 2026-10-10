import { readFileSync } from "node:fs";
export const objectiveReconnectContract=JSON.parse(
 readFileSync(new URL("../../Shared/contracts/objective-reconnect-bridge.json",import.meta.url),"utf8")
);
