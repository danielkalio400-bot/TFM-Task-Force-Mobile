import { randomUUID } from "node:crypto";

export class InventoryLedger {
  #balances = new Map();
  #transactions = [];

  balance(playerId, itemId) {
    return this.#balances.get(`${playerId}:${itemId}`) || 0;
  }

  apply({ playerId, itemId, quantity, kind, authoritySource }) {
    if (typeof playerId !== "string" || !playerId.trim() ||
        typeof itemId !== "string" || !itemId.trim() ||
        !Number.isInteger(quantity) || quantity <= 0 ||
        typeof authoritySource !== "string" || !authoritySource.trim()) {
      return { ok: false, error: "invalid_inventory_transaction" };
    }

    const key = `${playerId.trim()}:${itemId.trim()}`;
    const current = this.#balances.get(key) || 0;
    const consuming = kind === "consume" || kind === "revoke";
    const next = consuming ? current - quantity : current + quantity;
    if (next < 0) return { ok: false, error: "insufficient_inventory" };

    const transaction = {
      transactionId: randomUUID(),
      playerId: playerId.trim(),
      itemId: itemId.trim(),
      quantity,
      kind,
      authoritySource: authoritySource.trim(),
      createdAt: new Date().toISOString(),
    };

    this.#balances.set(key, next);
    this.#transactions.push(transaction);
    return { ok: true, transaction: { ...transaction }, balance: next };
  }

  transactionsFor(playerId) {
    return this.#transactions
      .filter(entry => entry.playerId === playerId)
      .map(entry => ({ ...entry }));
  }
}
