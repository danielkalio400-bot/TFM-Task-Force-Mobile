namespace TFM.Online.Objectives
{
    // Display/reconnect cursor only. Never authorizes objective captures.
    // Pages may have identical snapshot revisions while event pagination
    // continues; event sequence and snapshot revision are different cursors.
    public sealed class TFMObjectiveEventCursor
    {
        private readonly TFMObjectiveSnapshotBuffer _snapshots =
            new TFMObjectiveSnapshotBuffer();

        public long LastEventSequence { get; private set; }
        public TFMServerObjectiveSnapshot Snapshot { get { return _snapshots.Current; } }
        public bool RequiresFullResync { get; private set; }

        public bool Apply(TFMObjectiveReconnectView view)
        {
            if (view == null || view.snapshot == null || !view.snapshot.CanDisplay() ||
                view.nextSequence < 0)
                return false;

            TFMServerObjectiveSnapshot current = _snapshots.Current;
            if (current != null &&
                (current.matchId != view.snapshot.matchId ||
                 view.snapshot.revision < current.revision))
                return false;

            // Validate the entire page before mutating any buffered state.
            long next = LastEventSequence;
            if (view.resyncRequired)
            {
                next = view.snapshot.revision;
            }
            else
            {
                if (view.events != null)
                {
                    foreach (TFMObjectiveEvent entry in view.events)
                    {
                        if (entry == null || entry.sequence != next + 1 ||
                            entry.sequence > view.snapshot.revision)
                        {
                            RequiresFullResync = true;
                            return false;
                        }
                        next = entry.sequence;
                    }
                }
                if (view.nextSequence != next)
                {
                    RequiresFullResync = true;
                    return false;
                }
            }

            if (current == null || view.snapshot.revision > current.revision)
            {
                if (!_snapshots.Accept(view.snapshot)) return false;
            }

            LastEventSequence = next;
            RequiresFullResync = false;
            return true;
        }

        public void Clear()
        {
            LastEventSequence = 0;
            RequiresFullResync = false;
            _snapshots.Clear();
        }
    }
}
