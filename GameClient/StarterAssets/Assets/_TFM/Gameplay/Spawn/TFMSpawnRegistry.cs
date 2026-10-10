using System.Collections.Generic;
using TFM.Gameplay.Teams;
using UnityEngine;

namespace TFM.Gameplay.Spawn
{
    public sealed class TFMSpawnRegistry : MonoBehaviour
    {
        private readonly List<TFMSpawnPoint> _points = new List<TFMSpawnPoint>();

        public IReadOnlyList<TFMSpawnPoint> Points => _points;

        private void Awake()
        {
            Refresh();
        }

        public void Refresh()
        {
            _points.Clear();
            GetComponentsInChildren(true, _points);
        }

        public TFMSpawnPoint Select(TFMTeamMember team, int seed)
        {
            List<TFMSpawnPoint> eligible = new List<TFMSpawnPoint>();
            foreach (TFMSpawnPoint point in _points)
            {
                if (point != null && point.isActiveAndEnabled && point.IsEligible(team))
                {
                    eligible.Add(point);
                }
            }

            if (eligible.Count == 0)
            {
                return null;
            }

            int index = Mathf.Abs(seed) % eligible.Count;
            return eligible[index];
        }
    }
}
