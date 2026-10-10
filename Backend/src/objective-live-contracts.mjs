import { readFileSync } from "node:fs";
export const objectiveLiveContract=JSON.parse(
 readFileSync(new URL("../../Shared/contracts/objective-live-stream.json",import.meta.url),"utf8")
);
