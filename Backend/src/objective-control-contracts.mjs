import {readFileSync} from "node:fs";
export const objectiveControlContract=JSON.parse(
 readFileSync(new URL("../../Shared/contracts/objective-control-integrity.json",import.meta.url),"utf8")
);
