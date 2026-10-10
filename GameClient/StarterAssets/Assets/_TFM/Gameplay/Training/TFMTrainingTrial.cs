using System;
using System.Collections.Generic;
using TFM.Gameplay.Combat;
using TFM.Gameplay.Practice;
using UnityEngine;

namespace TFM.Gameplay.Training
{
    [DefaultExecutionOrder(-40)]
    public sealed class TFMTrainingTrial : MonoBehaviour
    {
        private const string LocalBestKey = "tfm.prototype.training.best.v1";
        [SerializeField, Range(10f, 300f)] private float durationSeconds = 75f;

        private readonly HashSet<TFMTargetDummy> _remaining = new HashSet<TFMTargetDummy>();
        private readonly List<TFMTargetDummy> _targets = new List<TFMTargetDummy>();
        private TFMHitscanWeapon _weapon;
        private float _elapsed;
        private bool _paused;

        public TFMTrainingTrialPhase Phase { get; private set; } = TFMTrainingTrialPhase.Ready;
        public int ShotsFired { get; private set; }
        public int ShotsHit { get; private set; }
        public int ShotsMissed { get; private set; }
        public int CurrentHitStreak { get; private set; }
        public int LongestHitStreak { get; private set; }
        public int TargetsCleared { get; private set; }
        public int TotalTargets { get { return _targets.Count; } }
        public int RemainingTargets { get { return _remaining.Count; } }
        public float RemainingTime { get { return Mathf.Max(0f, durationSeconds - _elapsed); } }
        public int Score { get; private set; }
        public int LocalBestScore { get { return PlayerPrefs.GetInt(LocalBestKey, 0); } }
        public float Accuracy { get { return ShotsFired > 0 ? (float)ShotsHit / ShotsFired : 0f; } }
        // Entirely local feedback: no ranked tier or online reward granted.
        public string PracticeMedal
        {
            get
            {
                if (Phase != TFMTrainingTrialPhase.Completed) return "None";
                if (Accuracy >= 0.9f && LongestHitStreak >= TotalTargets)
                    return "Gold";
                if (Accuracy >= 0.7f) return "Silver";
                return "Bronze";
            }
        }

        public event Action<TFMTrainingTrialPhase> PhaseChanged;

        public void Configure(TFMHitscanWeapon weapon, TFMTargetDummy[] availableTargets)
        {
            if (_weapon != null) _weapon.TrainingShotResolved -= OnTrainingShot;
            _weapon = weapon;
            _targets.Clear();
            if (availableTargets != null)
            {
                foreach (TFMTargetDummy target in availableTargets)
                {
                    if (target != null && !_targets.Contains(target))
                        _targets.Add(target);
                }
            }
            if (_weapon != null) _weapon.TrainingShotResolved += OnTrainingShot;
            if (Phase == TFMTrainingTrialPhase.Running) Cancel();
        }

        public bool Begin()
        {
            if (_weapon == null || _targets.Count == 0 || _paused) return false;
            // Offline practice activities cannot award points simultaneously.
            TFMObjectiveRound route = GetComponent<TFMObjectiveRound>();
            if (route != null) route.Cancel();
            _elapsed = 0f;
            ShotsFired = ShotsHit = ShotsMissed = 0;
            CurrentHitStreak = LongestHitStreak = 0;
            TargetsCleared = Score = 0;
            _remaining.Clear();
            foreach (TFMTargetDummy target in _targets)
            {
                if (target == null) continue;
                target.ResetForTrial();
                _remaining.Add(target);
            }
            if (_remaining.Count == 0) return false;
            _weapon.ResetTrainingAmmo();
            SetPhase(TFMTrainingTrialPhase.Running);
            return true;
        }

        public void Cancel()
        {
            if (Phase != TFMTrainingTrialPhase.Running) return;
            SetPhase(TFMTrainingTrialPhase.Cancelled);
        }

        private void Update()
        {
            if (Phase != TFMTrainingTrialPhase.Running || _paused) return;
            _elapsed = Mathf.Min(durationSeconds, _elapsed + Time.unscaledDeltaTime);
            if (_elapsed >= durationSeconds) Finish(TFMTrainingTrialPhase.Expired);
        }

        private void OnTrainingShot(TFMTrainingShotResult result)
        {
            if (Phase != TFMTrainingTrialPhase.Running || _paused) return;
            ShotsFired++;
            // A respawned or already-cleared dummy does not count as a new
            // training hit. Only the original outstanding targets are valid.
            if (result.Hit && result.Target != null &&
                _remaining.Contains(result.Target))
            {
                ShotsHit++;
                CurrentHitStreak++;
                LongestHitStreak = Mathf.Max(LongestHitStreak, CurrentHitStreak);
                if (result.TargetCleared && _remaining.Remove(result.Target))
                {
                    TargetsCleared++;
                    if (_remaining.Count == 0)
                        Finish(TFMTrainingTrialPhase.Completed);
                }
            }
            else
            {
                ShotsMissed++;
                CurrentHitStreak = 0;
            }
        }

        private void Finish(TFMTrainingTrialPhase terminal)
        {
            if (Phase != TFMTrainingTrialPhase.Running) return;
            Score = Mathf.Max(0, TargetsCleared * 100 +
                Mathf.RoundToInt(Accuracy * 200f) +
                (terminal == TFMTrainingTrialPhase.Completed
                    ? Mathf.RoundToInt(RemainingTime * 3f) : 0));
            if (terminal == TFMTrainingTrialPhase.Completed && Score > LocalBestScore)
            {
                PlayerPrefs.SetInt(LocalBestKey, Score);
                PlayerPrefs.Save();
            }
            SetPhase(terminal);
        }

        private void SetPhase(TFMTrainingTrialPhase next)
        {
            Phase = next;
            PhaseChanged?.Invoke(next);
        }

        private void OnApplicationPause(bool paused) { _paused = paused; }
        private void OnApplicationFocus(bool focused) { _paused = !focused; }

        private void OnDestroy()
        {
            if (_weapon != null) _weapon.TrainingShotResolved -= OnTrainingShot;
        }
    }
}
