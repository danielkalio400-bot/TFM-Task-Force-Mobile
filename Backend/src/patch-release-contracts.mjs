import { readFileSync } from "node:fs";

export const patchReleaseRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/patch-release-runtime.json", import.meta.url), "utf8")
);
