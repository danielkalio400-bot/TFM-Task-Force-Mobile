using System;

namespace TFM.Online.Objectives
{
    /// <summary>
    /// Read-only client diagnostics. Dedicated-server identity, capture
    /// validation and match results are never computed by this model.
    /// </summary>
    [Serializable]
    public sealed class TFMObjectiveDedicatedSyncState
    {
        public string matchId = string.Empty;
        public string roundId = string.Empty;
        public string serverId = string.Empty;
        public long lastRevision;
        public long lastEventSequence;
        public int sessionSequence;
        public bool resyncRequired;
        public bool progressionGranted;

        public bool Accept(TFMServerObjectiveSnapshot state,
            long eventSequence, int nextSessionSequence)
        {
            if(state==null||!state.CanDisplay()||eventSequence<0 ||
                nextSessionSequence<0 || progressionGranted ||
                (matchId.Length>0 && state.matchId!=matchId) ||
                (roundId.Length>0 && state.roundId!=roundId) ||
                state.revision<lastRevision ||
                eventSequence<lastEventSequence ||
                nextSessionSequence<sessionSequence)
                return false;

            matchId=state.matchId;
            roundId=state.roundId;
            serverId=state.serverId;
            lastRevision=state.revision;
            lastEventSequence=eventSequence;
            sessionSequence=nextSessionSequence;
            return true;
        }

        public void Clear()
        {
            matchId=string.Empty;
            roundId=string.Empty;
            serverId=string.Empty;
            lastRevision=0;
            lastEventSequence=0;
            sessionSequence=0;
            resyncRequired=false;
            progressionGranted=false;
        }
    }
}
