import { readFileSync } from "node:fs";

export const inventoryAuthorityRuntime = JSON.parse(
  readFileSync(new URL("../../Shared/contracts/inventory-authority-runtime.json", import.meta.url), "utf8")
);
