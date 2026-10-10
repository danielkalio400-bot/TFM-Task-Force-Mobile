function clean(value, max = 256) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

export class ServerRegistry {
  #servers = new Map();

  heartbeat(input) {
    const serverId = clean(input?.serverId);
    const region = clean(input?.region, 64);
    const endpoint = clean(input?.endpoint, 256);
    const capacity = Number.isInteger(input?.capacity) ? input.capacity : 0;
    const playerCount = Number.isInteger(input?.playerCount) ? input.playerCount : 0;
    const health = clean(input?.health, 32) || "unknown";

    if (!serverId || !region || !endpoint || capacity < 1 || playerCount < 0 || playerCount > capacity) {
      return { ok: false, error: "invalid_server_heartbeat" };
    }

    const state = {
      serverId,
      region,
      endpoint,
      capacity,
      playerCount,
      health,
      cpuLoad01: Math.max(0, Math.min(1, Number(input?.cpuLoad01) || 0)),
      memoryLoad01: Math.max(0, Math.min(1, Number(input?.memoryLoad01) || 0)),
      lastHeartbeatAt: new Date().toISOString(),
    };

    this.#servers.set(serverId, state);
    return { ok: true, server: { ...state } };
  }

  listReady(region) {
    return [...this.#servers.values()]
      .filter(server => server.region === region && server.health === "ready" && server.playerCount < server.capacity)
      .sort((a, b) => (a.playerCount / a.capacity) - (b.playerCount / b.capacity))
      .map(server => ({ ...server }));
  }

  choose(region) {
    return this.listReady(region)[0] || null;
  }

  get(serverId) {
    const server = this.#servers.get(serverId);
    return server ? { ...server } : null;
  }

  stats(region) {
    const values = [...this.#servers.values()]
      .filter(server => !region || server.region === region);

    return {
      total: values.length,
      ready: values.filter(server => server.health === "ready").length,
      degraded: values.filter(server => server.health === "degraded").length,
      offline: values.filter(server => server.health === "offline").length,
    };
  }
}

