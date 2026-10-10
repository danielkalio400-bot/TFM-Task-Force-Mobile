using System;
using System.Collections.Generic;
using TFM.Gameplay.Training;
using UnityEngine;

namespace TFM.Gameplay.Practice
{
    /// <summary>
    /// Offline time-trial route using the actual Training Yard controller.
    /// This does not emit XP, ranked outcomes or network-result claims.
    /// </summary>
    [DefaultExecutionOrder(-38)]
    public sealed class TFMObjectiveRound : MonoBehaviour
    {
        private const string BestKey = "tfm.prototype.waypoint.best.v1";
        private const string BestTimeKey = "tfm.prototype.waypoint.best-time.v1";
        [SerializeField, Range(15f, 300f)] private float timeLimit = 90f;
        [SerializeField] private TFMTrainingTrial training;
        [SerializeField] private Transform player;

        private readonly List<TFMObjectiveWaypoint> _waypoints =
            new List<TFMObjectiveWaypoint>();
        private readonly HashSet<int> _awarded = new HashSet<int>();
        private float _elapsed;
        private float _lastArrivalTime;
        private bool _paused;

        public TFMObjectiveRoundPhase Phase { get; private set; } = TFMObjectiveRoundPhase.Ready;
        public int NextWaypointIndex { get; private set; }
        public int WaypointCount { get { return _waypoints.Count; } }
        public int CompletedWaypoints { get { return _awarded.Count; } }
        public float RemainingSeconds { get { return Mathf.Max(0f, timeLimit - _elapsed); } }
        public int Score { get; private set; }
        public int LocalBest { get { return PlayerPrefs.GetInt(BestKey, 0); } }
        public float BestCourseTimeSeconds { get { return PlayerPrefs.GetFloat(BestTimeKey, 0f); } }
        public float ElapsedSeconds { get { return _elapsed; } }
        public float LastLegSeconds { get; private set; }
        public bool NewPersonalBestTime { get; private set; }
        public bool Paused { get { return _paused; } }
        public float NextWaypointDistanceMeters
        {
            get
            {
                if (Phase != TFMObjectiveRoundPhase.Active ||
                    player == null || NextWaypointIndex >= _waypoints.Count ||
                    _waypoints[NextWaypointIndex] == null)
                    return 0f;
                Vector3 offset = _waypoints[NextWaypointIndex].transform.position -
                    player.position;
                offset.y = 0f;
                return offset.magnitude;
            }
        }
        // World-space compass directions, not street/navigation routing.
        public string NextWaypointDirection
        {
            get
            {
                if (Phase != TFMObjectiveRoundPhase.Active ||
                    player == null || NextWaypointIndex >= _waypoints.Count ||
                    _waypoints[NextWaypointIndex] == null)
                    return string.Empty;
                TFMObjectiveWaypoint marker = _waypoints[NextWaypointIndex];
                Vector3 offset = marker.transform.position - player.position;
                offset.y = 0f;
                if (offset.sqrMagnitude <= marker.Radius * marker.Radius)
                    return "HERE";
                return Mathf.Abs(offset.x) > Mathf.Abs(offset.z)
                    ? (offset.x >= 0f ? "E" : "W")
                    : (offset.z >= 0f ? "N" : "S");
            }
        }
        public event Action<TFMObjectiveRoundPhase> PhaseChanged;

        public void Configure(Transform controlledPlayer, TFMTrainingTrial trainingTrial,
            TFMObjectiveWaypoint[] route)
        {
            if (Phase == TFMObjectiveRoundPhase.Active) Cancel();
            training = trainingTrial;
            player = controlledPlayer;
            _waypoints.Clear();
            if (route != null)
            {
                foreach (TFMObjectiveWaypoint waypoint in route)
                    if (waypoint != null && !_waypoints.Contains(waypoint))
                        _waypoints.Add(waypoint);
            }
            _waypoints.Sort((a,b) => a.Sequence.CompareTo(b.Sequence));
            Phase = TFMObjectiveRoundPhase.Ready;
            RefreshMarkers();
        }

        public bool Begin()
        {
            if (player == null || _waypoints.Count == 0 || _paused) return false;
            for (int i = 0; i < _waypoints.Count; i++)
                if (_waypoints[i] == null || _waypoints[i].Sequence != i) return false;
            if (training != null) training.Cancel();
            _awarded.Clear();
            NextWaypointIndex = 0;
            _elapsed = 0f;
            _lastArrivalTime = 0f;
            LastLegSeconds = 0f;
            NewPersonalBestTime = false;
            Score = 0;
            SetPhase(TFMObjectiveRoundPhase.Active);
            RefreshMarkers();
            return true;
        }

        public void Cancel()
        {
            if (Phase != TFMObjectiveRoundPhase.Active) return;
            SetPhase(TFMObjectiveRoundPhase.Cancelled);
            RefreshMarkers();
        }

        private void Update()
        {
            if (Phase != TFMObjectiveRoundPhase.Active || _paused || player == null) return;
            // No progress while backgrounded. Large skipped frames do not let
            // the player bypass the entire sequence in one tick.
            float step = Mathf.Clamp(Time.unscaledDeltaTime, 0f, 0.2f);
            _elapsed = Mathf.Min(timeLimit, _elapsed + step);
            if (_elapsed >= timeLimit)
            {
                Finish(TFMObjectiveRoundPhase.Expired);
                return;
            }

            TFMObjectiveWaypoint next = _waypoints[NextWaypointIndex];
            if (!next.ContainsXZ(player.position)) return;
            if (_awarded.Add(NextWaypointIndex))
            {
                Score += 100;
                LastLegSeconds = Mathf.Max(0f, _elapsed - _lastArrivalTime);
                _lastArrivalTime = _elapsed;
            }
            NextWaypointIndex++;
            if (NextWaypointIndex >= _waypoints.Count)
            {
                Finish(TFMObjectiveRoundPhase.Completed);
                return;
            }
            RefreshMarkers();
        }

        private void Finish(TFMObjectiveRoundPhase result)
        {
            if (Phase != TFMObjectiveRoundPhase.Active) return;
            if (result == TFMObjectiveRoundPhase.Completed)
            {
                Score += Mathf.CeilToInt(RemainingSeconds * 2f);
                bool saveBest = false;
                if (Score > LocalBest)
                {
                    PlayerPrefs.SetInt(BestKey, Score);
                    saveBest = true;
                }
                float previousFastest = BestCourseTimeSeconds;
                if (_elapsed > 0f && (previousFastest <= 0f || _elapsed < previousFastest))
                {
                    NewPersonalBestTime = true;
                    PlayerPrefs.SetFloat(BestTimeKey, _elapsed);
                    saveBest = true;
                }
                if (saveBest) PlayerPrefs.Save();
            }
            SetPhase(result);
            RefreshMarkers();
        }

        private void RefreshMarkers()
        {
            for (int i = 0; i < _waypoints.Count; i++)
            {
                TFMObjectiveWaypoint marker = _waypoints[i];
                if (marker != null)
                    marker.Show(Phase == TFMObjectiveRoundPhase.Active && i == NextWaypointIndex);
            }
        }

        private void SetPhase(TFMObjectiveRoundPhase next)
        {
            Phase = next;
            PhaseChanged?.Invoke(next);
        }

        private void OnApplicationPause(bool paused) { _paused = paused; }
        private void OnApplicationFocus(bool focused) { _paused = !focused; }
    }
}
