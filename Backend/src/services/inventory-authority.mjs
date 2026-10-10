export class InventoryAuthorityService {
  #processed = new Map();

  constructor({ ledger, contract }) {
    this.ledger = ledger;
    this.trustedSources = new Set(contract?.trustedAuthoritySources || []);
    this.allowedKinds = new Set(contract?.allowedKinds || []);
  }

  mutate(input) {
    const playerId = String(input?.playerId || "").trim();
    const itemId = String(input?.itemId || "").trim();
    const authoritySource = String(input?.authoritySource || "").trim();
    const sourceId = String(input?.sourceId || "").trim();
    const kind = String(input?.kind || "").trim();
    const quantity = Math.trunc(Number(input?.quantity) || 0);

    if (!playerId || !itemId || !sourceId || quantity <= 0)
      return { ok: false, error: "invalid_inventory_authority_transaction" };
    if (!this.trustedSources.has(authoritySource))
      return { ok: false, error: "untrusted_inventory_authority_source" };
    if (!this.allowedKinds.has(kind))
      return { ok: false, error: "invalid_inventory_mutation_kind" };

    const key = [authoritySource, sourceId, playerId, itemId, kind].join(":");
    if (this.#processed.has(key)) {
      return {
        ok: true,
        duplicate: true,
        ...structuredClone(this.#processed.get(key)),
      };
    }

    const result = this.ledger.apply({
      playerId,
      itemId,
      quantity,
      kind,
      authoritySource,
    });
    if (!result.ok) return result;

    const receipt = {
      transactionId: result.transaction.transactionId,
      playerId,
      itemId,
      quantity,
      kind,
      authoritySource,
      sourceId,
      balanceAfter: result.balance,
      createdAt: result.transaction.createdAt,
    };

    const stored = { receipt, balance: result.balance };
    this.#processed.set(key, stored);

    return {
      ok: true,
      duplicate: false,
      receipt: { ...receipt },
      balance: result.balance,
    };
  }

  balance(playerId, itemId) {
    const player = String(playerId || "").trim();
    const item = String(itemId || "").trim();
    if (!player || !item) return { ok: false, error: "invalid_inventory_balance_query" };
    return {
      ok: true,
      balance: {
        playerId: player,
        itemId: item,
        quantity: this.ledger.balance(player, item),
      },
    };
  }

  history(playerId, limit = 100) {
    const player = String(playerId || "").trim();
    if (!player) return { ok: false, error: "invalid_player" };
    const count = Math.min(500, Math.max(1, Math.trunc(Number(limit) || 100)));
    return {
      ok: true,
      transactions: this.ledger.transactionsFor(player).slice(-count),
    };
  }
}
