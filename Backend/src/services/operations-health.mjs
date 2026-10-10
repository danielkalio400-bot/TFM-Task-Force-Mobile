export class OperationsHealthService {
  constructor({ servers, incidents }) {
    this.servers = servers;
    this.incidents = incidents;
  }

  snapshot(region = "west-africa") {
    const serverStats = this.servers.stats(region);
    const openIncidents = this.incidents.open();
    const major = openIncidents.filter(incident =>
      incident.severity === "major" || incident.severity === "critical"
    ).length;

    let gameServers = "healthy";
    if (serverStats.ready === 0) gameServers = "unavailable";
    else if (major > 0 || serverStats.degraded > 0) gameServers = "degraded";

    return {
      region,
      matchmaking: major > 0 ? "degraded" : "healthy",
      gameServers,
      progression: "healthy",
      readyServers: serverStats.ready,
      degradedServers: serverStats.degraded,
      openIncidents: openIncidents.length,
      capturedAt: new Date().toISOString(),
    };
  }
}
