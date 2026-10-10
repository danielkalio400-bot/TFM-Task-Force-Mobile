import { readFileSync } from "node:fs";
export const offlineObjectiveCourse = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/offline-objective-course.json", import.meta.url), "utf8")
);
