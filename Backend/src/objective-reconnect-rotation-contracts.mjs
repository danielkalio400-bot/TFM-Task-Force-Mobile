import {readFileSync} from "node:fs";
export const objectiveReconnectRotationContract=JSON.parse(readFileSync(
 new URL("../../Shared/contracts/objective-reconnect-rotation.json",import.meta.url),"utf8"));
