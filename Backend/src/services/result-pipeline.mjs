export class ResultPipelineService {
  constructor({ matchResults, rewards, profiles }) {
    this.matchResults = matchResults;
    this.rewards = rewards;
    this.profiles = profiles;
  }

  process(payload) {
    const accepted = this.matchResults.ingest(payload);
    if (!accepted.ok) return { ok: false, error: accepted.error };

    const applied = [];
    for (const player of accepted.result.players) {
      const won = Boolean(
        accepted.result.winningTeamId &&
        player.teamId === accepted.result.winningTeamId
      );

      const rewardResult = this.rewards.calculate({
        matchId: accepted.result.matchId,
        playerId: player.playerId,
        score: player.score,
        objectives: 0,
        won,
      });

      if (!rewardResult.ok) continue;

      const profileResult = this.profiles.grant(player.playerId, {
        experience: rewardResult.reward.experience,
        credits: rewardResult.reward.softCredits,
      });

      if (profileResult.ok) {
        applied.push({
          playerId: player.playerId,
          reward: rewardResult.reward,
          progression: profileResult.progression,
        });
      }
    }

    return {
      ok: true,
      result: accepted.result,
      rewardsApplied: applied,
    };
  }
}
