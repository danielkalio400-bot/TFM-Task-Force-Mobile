import { readFileSync } from "node:fs";

export const authoritativeMatchRecordsRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/authoritative-match-records.json", import.meta.url), "utf8")
);
