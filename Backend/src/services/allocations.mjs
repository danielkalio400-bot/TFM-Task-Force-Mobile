import { randomUUID } from "node:crypto";

function clean(value, max = 128) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 && result.length <= max ? result : null;
}

export class AllocationService {
  #allocations = new Map();

  create(input) {
    const matchId = clean(input?.matchId);
    const region = clean(input?.region, 24);
    if (!matchId || !region) {
      return { ok: false, error: "invalid_allocation_request" };
    }

    const allocation = {
      allocationId: randomUUID(),
      matchId,
      region,
      state: "pending",
      createdAt: new Date().toISOString(),
    };
    this.#allocations.set(allocation.allocationId, allocation);
    return { ok: true, allocation: { ...allocation } };
  }

  get(allocationId) {
    const allocation = this.#allocations.get(allocationId);
    return allocation ? { ...allocation } : null;
  }
}
