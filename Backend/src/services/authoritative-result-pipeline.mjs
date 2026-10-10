export class AuthoritativeResultPipelineService {
  constructor({ archive, replay, progression }) {
    this.archive = archive;
    this.replay = replay;
    this.progression = progression;
  }

  process(input) {
    const archived = this.archive.ingest(input);
    if (!archived.ok) return archived;

    const replayManifest = this.replay.manifest(archived.record.matchId);
    const progression = [];

    for (const player of archived.record.players) {
      const won = Boolean(
        archived.record.winningTeamId &&
        player.teamId === archived.record.winningTeamId
      );
      const result = this.progression.grant({
        playerId: player.playerId,
        sourceType: "validated-match-result",
        sourceId: archived.record.matchId,
        experience: 100 + player.score * 2 + player.assists * 10 + (won ? 150 : 50),
        softCredits: Math.min(5000, 40 + Math.floor(player.score / 5) + (won ? 30 : 10)),
      });
      if (result.ok) progression.push({
        playerId: player.playerId,
        duplicate: result.duplicate,
        progression: result.progression,
        newlyGrantedUnlocks: result.newlyGrantedUnlocks || [],
      });
    }

    return {
      ok: true,
      record: archived.record,
      replayManifest,
      progression,
    };
  }
}
