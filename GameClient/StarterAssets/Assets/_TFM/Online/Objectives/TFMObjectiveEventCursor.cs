namespace TFM.Online.Objectives
{
    // UI/reconnect buffer only. It never authorizes objective captures.
    public sealed class TFMObjectiveEventCursor
    {
        private readonly TFMObjectiveSnapshotBuffer _snapshots =
            new TFMObjectiveSnapshotBuffer();

        public long LastEventSequence { get; private set; }
        public TFMServerObjectiveSnapshot Snapshot { get { return _snapshots.Current; } }

        public bool Apply(TFMObjectiveReconnectView view)
        {
            if (view == null || view.snapshot == null || view.nextSequence < 0)
                return false;
            if (!_snapshots.Accept(view.snapshot)) return false;
            if (view.resyncRequired)
            {
                LastEventSequence = view.snapshot.revision;
                return true;
            }
            if (view.events != null)
            {
                foreach (TFMObjectiveEvent entry in view.events)
                {
                    if (entry == null || entry.sequence != LastEventSequence + 1)
                    {
                        // Caller must request a full snapshot resynchronization.
                        return false;
                    }
                    LastEventSequence = entry.sequence;
                }
            }
            return true;
        }

        public void Clear()
        {
            LastEventSequence = 0;
            _snapshots.Clear();
        }
    }
}
