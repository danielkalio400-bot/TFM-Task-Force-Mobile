import { randomUUID } from "node:crypto";

export class IncidentService {
  #incidents = new Map();

  create(input) {
    const service = String(input?.service || "").trim();
    const region = String(input?.region || "").trim();
    const code = String(input?.code || "").trim();
    const severity = String(input?.severity || "warning").trim();

    if (!service || !code) return { ok: false, error: "invalid_incident" };

    const incident = {
      incidentId: randomUUID(),
      service,
      region,
      code,
      severity,
      summary: String(input?.summary || "").slice(0, 240),
      resolved: false,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    this.#incidents.set(incident.incidentId, incident);
    return { ok: true, incident: { ...incident } };
  }

  resolve(incidentId) {
    const incident = this.#incidents.get(incidentId);
    if (!incident) return { ok: false, error: "incident_not_found" };
    incident.resolved = true;
    incident.resolvedAt = new Date().toISOString();
    return { ok: true, incident: { ...incident } };
  }

  open() {
    return [...this.#incidents.values()]
      .filter(incident => !incident.resolved)
      .map(incident => ({ ...incident }));
  }
}
