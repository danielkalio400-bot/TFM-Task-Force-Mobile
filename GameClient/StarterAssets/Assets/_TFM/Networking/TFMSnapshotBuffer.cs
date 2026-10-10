using System.Collections.Generic;

namespace TFM.Networking
{
    public sealed class TFMSnapshotBuffer
    {
        private readonly List<TFMPlayerNetworkSnapshot> _snapshots;
        private readonly int _capacity;

        public TFMSnapshotBuffer(int capacity = 32)
        {
            _capacity = capacity < 2 ? 2 : capacity;
            _snapshots = new List<TFMPlayerNetworkSnapshot>(_capacity);
        }

        public int Count => _snapshots.Count;

        public void Push(TFMPlayerNetworkSnapshot snapshot)
        {
            if (_snapshots.Count > 0 &&
                snapshot.sequence <= _snapshots[_snapshots.Count - 1].sequence)
            {
                return;
            }

            _snapshots.Add(snapshot);
            if (_snapshots.Count > _capacity)
            {
                _snapshots.RemoveAt(0);
            }
        }

        public bool TrySample(double targetTime, out TFMPlayerNetworkSnapshot snapshot)
        {
            snapshot = default;
            if (_snapshots.Count == 0) return false;
            if (_snapshots.Count == 1)
            {
                snapshot = _snapshots[0];
                return true;
            }

            for (int index = 1; index < _snapshots.Count; index++)
            {
                TFMPlayerNetworkSnapshot next = _snapshots[index];
                if (next.serverTime >= targetTime)
                {
                    snapshot = TFMPlayerNetworkSnapshot.Interpolate(
                        _snapshots[index - 1],
                        next,
                        targetTime);
                    return true;
                }
            }

            snapshot = _snapshots[_snapshots.Count - 1];
            return true;
        }

        public void Clear()
        {
            _snapshots.Clear();
        }
    }
}
