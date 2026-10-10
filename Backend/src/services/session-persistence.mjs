import { randomUUID } from "node:crypto";

export class SessionPersistenceService {
  #latestByMatch = new Map();

  save(input) {
    const matchId = String(input?.matchId || "").trim();
    const sectionId = String(input?.sectionId || "").trim();
    const modeId = String(input?.modeId || "").trim();
    const mapId = String(input?.mapId || "").trim();
    if (!matchId || !sectionId || !modeId || !mapId)
      return { ok: false, error: "invalid_session_snapshot" };

    const previous = this.#latestByMatch.get(matchId);
    const sequence = (previous?.sequence || 0) + 1;
    const snapshot = {
      snapshotId: randomUUID(),
      matchId,
      sectionId,
      modeId,
      mapId,
      region: String(input?.region || "").trim(),
      serverId: String(input?.serverId || "").trim(),
      runtimePhase: String(input?.runtimePhase || "").trim(),
      sequence,
      capturedAt: new Date().toISOString(),
      terminal: Boolean(input?.terminal),
    };

    this.#latestByMatch.set(matchId, snapshot);
    return { ok: true, snapshot: { ...snapshot } };
  }

  /**
   * Fail-closed optimistic checkpoint. A dedicated server may only advance
   * the exact session it just observed; stale or reassigned instances cannot
   * overwrite another server's phase/terminal state.
   */
  saveIfCurrent(input,{expectedSequence,expectedServerId,expectedMapId}={}) {
    const matchId=String(input?.matchId||"").trim();
    if(!matchId || !Number.isSafeInteger(expectedSequence) ||
       expectedSequence<1 || !expectedServerId || !expectedMapId)
      return {ok:false,error:"invalid_session_checkpoint_fence"};
    const previous=this.#latestByMatch.get(matchId);
    if(!previous || previous.sequence!==expectedSequence)
      return {ok:false,error:"session_checkpoint_stale"};
    if(previous.serverId!==expectedServerId ||
       previous.mapId!==expectedMapId ||
       input?.serverId!==expectedServerId ||
       input?.mapId!==expectedMapId)
      return {ok:false,error:"session_checkpoint_reassigned"};
    if(previous.terminal)
      return {ok:false,error:"session_checkpoint_terminal"};
    const nextPhase=String(input.runtimePhase||"").trim();
    if(!nextPhase)
      return {ok:false,error:"session_checkpoint_phase_required"};
    // Fail closed on a phase regression caused by a stale match host.
    if((previous.runtimePhase==="active" &&
        !["active","completed","expired","cancelled"].includes(nextPhase)) ||
       (["completed","expired","cancelled"].includes(previous.runtimePhase)))
      return {ok:false,error:"session_checkpoint_phase_regression"};
    return this.save(input);
  }

  latest(matchId) {
    const snapshot = this.#latestByMatch.get(matchId);
    return snapshot ? { ...snapshot } : null;
  }
}
