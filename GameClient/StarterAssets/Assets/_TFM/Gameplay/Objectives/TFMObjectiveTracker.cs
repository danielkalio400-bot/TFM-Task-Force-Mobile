using System;

namespace TFM.Gameplay.Objectives
{
    public sealed class TFMObjectiveTracker
    {
        private readonly TFMObjectiveDefinition _definition;

        public TFMObjectiveTracker(TFMObjectiveDefinition definition)
        {
            _definition = definition ?? throw new ArgumentNullException(nameof(definition));
            _definition.Normalize();
        }

        public TFMObjectiveState State { get; private set; } = TFMObjectiveState.Inactive;
        public float Progress { get; private set; }
        public float Target => _definition.TargetProgress;
        public event Action Changed;

        public void Activate()
        {
            if (State == TFMObjectiveState.Completed && !_definition.Repeatable) return;
            if (State == TFMObjectiveState.Active) return;
            State = TFMObjectiveState.Active;
            Changed?.Invoke();
        }

        public void AddProgress(float amount)
        {
            if (State != TFMObjectiveState.Active || amount <= 0f) return;
            Progress = Math.Min(Target, Progress + amount);
            if (Progress >= Target)
            {
                State = TFMObjectiveState.Completed;
            }
            Changed?.Invoke();
        }

        public void Reset()
        {
            Progress = 0f;
            State = TFMObjectiveState.Inactive;
            Changed?.Invoke();
        }
    }
}
