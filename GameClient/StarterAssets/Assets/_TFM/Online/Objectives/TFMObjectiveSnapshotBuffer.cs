namespace TFM.Online.Objectives
{
    // Client display buffer only. Never computes match outcomes.
    public sealed class TFMObjectiveSnapshotBuffer
    {
        public TFMServerObjectiveSnapshot Current { get; private set; }

        public bool Accept(TFMServerObjectiveSnapshot incoming)
        {
            if (incoming == null || !incoming.CanDisplay()) return false;
            if (Current != null &&
                (Current.matchId != incoming.matchId ||
                 incoming.revision <= Current.revision))
                return false;
            Current = incoming;
            return true;
        }

        public void Clear() { Current = null; }
    }
}
