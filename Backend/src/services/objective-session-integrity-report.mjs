/**
 * Read-only operator diagnostic for checkpoint/scoreboard consistency.
 * No secret material, player rosters or privileged write capability escapes.
 */
export function inspectObjectiveSessionIntegrity({rounds,persistence,matchId}={}) {
  if(typeof matchId!=="string" || matchId.length<1 || matchId.length>160 ||
     typeof rounds?.snapshot!=="function" ||
     typeof persistence?.latest!=="function")
    return {ok:false,error:"invalid_integrity_query"};
  const round=rounds.snapshot(matchId);
  const session=persistence.latest(matchId);
  if(!round || !session)
    return {ok:false,error:"objective_or_checkpoint_missing"};
  const sameAuthority=round.serverId===session.serverId &&
    round.mapId===session.mapId;
  const terminal=["completed","expired","cancelled"].includes(round.phase);
  const aligned=sameAuthority && round.phase===session.runtimePhase &&
    terminal===session.terminal;
  return Object.freeze({
    ok:true,matchId,
    aligned,
    status:!sameAuthority?"authority_conflict":
      round.phase!==session.runtimePhase?"phase_conflict":
      terminal!==session.terminal?"terminal_conflict":"consistent",
    objectiveRevision:round.revision,
    checkpointSequence:session.sequence,
    terminal:session.terminal,
    // Deliberately no player identifiers, connection credentials or roster.
    grantsProgression:false
  });
}
