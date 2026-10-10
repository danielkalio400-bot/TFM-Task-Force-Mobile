import { readFileSync } from "node:fs";

export const homeSections = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/home-sections.json", import.meta.url), "utf8")
);
