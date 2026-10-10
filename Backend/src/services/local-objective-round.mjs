// Deterministic, side-effect-free reference rules for client offline QA.
// NEVER used as authoritative match-result or player progression service.
export class LocalObjectiveRound {
  constructor({ count = 5, timeLimitSeconds = 90 } = {}) {
    if (!Number.isSafeInteger(count) || count < 1 || count > 50 ||
        !Number.isSafeInteger(timeLimitSeconds) || timeLimitSeconds < 1 || timeLimitSeconds > 3600)
      throw new Error("invalid_offline_round_config");
    this.count = count;
    this.timeLimitSeconds = timeLimitSeconds;
    this.reset();
  }
  reset() {
    this.phase = "Ready";
    this.index = 0;
    this.score = 0;
    this.elapsed = 0;
    this.seen = new Set();
    this.best = this.best || 0;
    return this.snapshot();
  }
  begin() {
    this.reset();
    this.phase = "Active";
    return this.snapshot();
  }
  tick(seconds, { focused = true } = {}) {
    if (this.phase !== "Active") return this.snapshot();
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 0.2)
      throw new Error("invalid_offline_tick");
    if (focused) this.elapsed = Math.min(this.timeLimitSeconds, this.elapsed + seconds);
    if (this.elapsed >= this.timeLimitSeconds) this.phase = "Expired";
    return this.snapshot();
  }
  arrive(index) {
    if (this.phase !== "Active" || !Number.isSafeInteger(index) ||
        index !== this.index || this.seen.has(index)) return false;
    this.seen.add(index);
    this.score += 100;
    this.index++;
    if (this.index >= this.count) {
      this.phase = "Completed";
      this.score += Math.ceil(Math.max(0, this.timeLimitSeconds - this.elapsed) * 2);
      this.best = Math.max(this.best, this.score);
    }
    return true;
  }
  cancel() { if (this.phase === "Active") this.phase = "Cancelled"; return this.snapshot(); }
  snapshot() {
    return {
      phase:this.phase, nextIndex:this.index, completedWaypoints:this.seen.size,
      count:this.count, remainingSeconds:Math.max(0,this.timeLimitSeconds - this.elapsed),
      score:this.score, localBest:this.best, offline:true
    };
  }
}
