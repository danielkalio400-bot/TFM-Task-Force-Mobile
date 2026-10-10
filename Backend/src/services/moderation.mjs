import { randomUUID } from "node:crypto";

const CATEGORIES = new Set([
  "harassment",
  "hate-or-abuse",
  "cheating",
  "exploit-abuse",
  "inappropriate-name",
  "voice-or-chat-abuse",
  "other",
]);

export class ModerationService {
  #reports = [];

  submit(input) {
    const reporterPlayerId = String(input?.reporterPlayerId || "").trim();
    const reportedPlayerId = String(input?.reportedPlayerId || "").trim();
    const category = String(input?.category || "").trim();
    const note = String(input?.note || "").trim().slice(0, 500);

    if (!reporterPlayerId || !reportedPlayerId || reporterPlayerId === reportedPlayerId)
      return { ok: false, error: "invalid_report" };
    if (!CATEGORIES.has(category))
      return { ok: false, error: "invalid_report_category" };

    const report = {
      reportId: randomUUID(),
      reporterPlayerId,
      reportedPlayerId,
      matchId: String(input?.matchId || "").trim(),
      category,
      note,
      status: "received",
      createdAt: new Date().toISOString(),
    };
    this.#reports.push(report);
    return { ok: true, report: { ...report } };
  }

  stats() {
    return {
      received: this.#reports.length,
      open: this.#reports.filter(report => report.status === "received").length,
    };
  }
}
