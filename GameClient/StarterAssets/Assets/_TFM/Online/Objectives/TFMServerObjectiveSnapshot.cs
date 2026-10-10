using System;
using UnityEngine;

namespace TFM.Online.Objectives
{
    [Serializable]
    public sealed class TFMServerObjectiveScores
    {
        public int alpha;
        public int bravo;
    }

    // Read-only deserialization; a local scene cannot claim server authority.
    [Serializable]
    public sealed class TFMServerObjectiveSnapshot
    {
        public string roundId = string.Empty;
        public string matchId = string.Empty;
        public string mapId = string.Empty;
        public string phase = "warmup";
        public long revision;
        public string serverId = string.Empty;
        public string winningTeamId = string.Empty;
        public TFMServerObjectiveScores scores = new TFMServerObjectiveScores();
        public bool persistentResult;
        public bool grantsProgression;

        public bool IsCurrentAfter(TFMServerObjectiveSnapshot previous)
        {
            return previous == null ||
                (matchId == previous.matchId && revision > previous.revision);
        }

        public bool CanDisplay()
        {
            return !string.IsNullOrWhiteSpace(matchId) &&
                revision >= 1 && scores != null &&
                scores.alpha >= 0 && scores.bravo >= 0;
        }
    }
}
