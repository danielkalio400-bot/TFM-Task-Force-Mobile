using System;

namespace TFM.Online.Sections
{
    public sealed class TFMSectionLifecycleMachine
    {
        public TFMSectionLifecycleState State { get; } = new();

        public bool TryMove(TFMSectionLifecyclePhase next, string failureCode = "")
        {
            if (!CanMove(State.Phase, next)) return false;

            State.Phase = next;
            State.FailureCode = next == TFMSectionLifecyclePhase.Failed
                ? failureCode ?? string.Empty
                : string.Empty;
            State.UpdatedAtUnixMilliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            return true;
        }

        public static bool CanMove(TFMSectionLifecyclePhase current, TFMSectionLifecyclePhase next)
        {
            if (current == next) return false;

            return current switch
            {
                TFMSectionLifecyclePhase.Idle => next == TFMSectionLifecyclePhase.CheckingContent,
                TFMSectionLifecyclePhase.CheckingContent => next == TFMSectionLifecyclePhase.CheckingMap || next == TFMSectionLifecyclePhase.Failed,
                TFMSectionLifecyclePhase.CheckingMap => next == TFMSectionLifecyclePhase.CreatingSession || next == TFMSectionLifecyclePhase.Failed,
                TFMSectionLifecyclePhase.CreatingSession => next == TFMSectionLifecyclePhase.AllocatingServer || next == TFMSectionLifecyclePhase.Failed,
                TFMSectionLifecyclePhase.AllocatingServer => next == TFMSectionLifecyclePhase.Connecting || next == TFMSectionLifecyclePhase.Failed,
                TFMSectionLifecyclePhase.Connecting => next == TFMSectionLifecyclePhase.Active || next == TFMSectionLifecyclePhase.Recovering || next == TFMSectionLifecyclePhase.Failed,
                TFMSectionLifecyclePhase.Active => next == TFMSectionLifecyclePhase.Results || next == TFMSectionLifecyclePhase.Recovering || next == TFMSectionLifecyclePhase.Failed,
                TFMSectionLifecyclePhase.Recovering => next == TFMSectionLifecyclePhase.Active || next == TFMSectionLifecyclePhase.Failed,
                TFMSectionLifecyclePhase.Results => next == TFMSectionLifecyclePhase.Returning || next == TFMSectionLifecyclePhase.Failed,
                TFMSectionLifecyclePhase.Returning => next == TFMSectionLifecyclePhase.Idle,
                TFMSectionLifecyclePhase.Failed => next == TFMSectionLifecyclePhase.Idle,
                _ => false
            };
        }
    }
}
