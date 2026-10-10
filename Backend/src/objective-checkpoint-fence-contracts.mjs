import {readFileSync} from "node:fs";
export const objectiveCheckpointFenceContract=JSON.parse(
 readFileSync(new URL("../../Shared/contracts/objective-session-checkpoint-fence.json",import.meta.url),"utf8")
);
