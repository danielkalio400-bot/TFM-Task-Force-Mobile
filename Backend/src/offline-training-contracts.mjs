import { readFileSync } from "node:fs";
export const offlineTrainingTrial = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/offline-training-trial.json", import.meta.url), "utf8")
);
