export class FairMatchmakingPolicyService {
  constructor(contract) {
    this.defaults = contract.defaults;
  }

  allowedSkillDelta(waitSeconds) {
    const elapsed = Math.max(0, Number(waitSeconds) || 0);
    const expansions = Math.floor(elapsed / 30);
    return Math.min(
      this.defaults.maximumSkillDelta,
      this.defaults.initialSkillDelta + expansions * this.defaults.skillExpansionPer30Seconds
    );
  }

  sharedRegion(a, b) {
    for (const region of a.preferredRegions || []) {
      if ((b.preferredRegions || []).includes(region)) return region;
    }
    return "";
  }

  evaluate(a, b, nowMs = Date.now()) {
    if (!a || !b) return { compatible: false, reason: "missing_ticket" };
    if (a.state !== "searching" || b.state !== "searching")
      return { compatible: false, reason: "ticket_not_searching" };
    if (a.sectionId !== b.sectionId || a.modeId !== b.modeId)
      return { compatible: false, reason: "playlist_mismatch" };
    if (!a.allowCrossPlatform || !b.allowCrossPlatform) {
      if (a.platform !== b.platform)
        return { compatible: false, reason: "cross_platform_disabled" };
    }

    const region = this.sharedRegion(a, b);
    if (!region) return { compatible: false, reason: "no_shared_region" };

    const oldestCreated = Math.min(a.createdAtMs, b.createdAtMs);
    const waitSeconds = Math.max(0, (nowMs - oldestCreated) / 1000);
    const allowed = this.allowedSkillDelta(waitSeconds);
    const spread = Math.abs(a.skillRating - b.skillRating);
    if (spread > allowed)
      return { compatible: false, reason: "skill_spread_too_wide", allowedSkillDelta: allowed, skillSpread: spread };

    return {
      compatible: true,
      region,
      allowedSkillDelta: allowed,
      skillSpread: spread,
      waitSeconds,
    };
  }
}
