using System;

namespace TFM.Online.MatchFlow
{
    public sealed class TFMMatchFlowMachine
    {
        public TFMMatchFlowState State { get; } = new();
        public event Action<TFMMatchFlowPhase, TFMMatchFlowPhase> Changed;

        public bool TryMove(TFMMatchFlowPhase next, string failureCode = "")
        {
            if (!CanMove(State.Phase, next)) return false;

            var previous = State.Phase;
            State.Phase = next;
            State.FailureCode = next == TFMMatchFlowPhase.Failed
                ? failureCode ?? string.Empty
                : string.Empty;
            Changed?.Invoke(previous, next);
            return true;
        }

        public static bool CanMove(TFMMatchFlowPhase current, TFMMatchFlowPhase next)
        {
            if (current == next) return false;
            return current switch
            {
                TFMMatchFlowPhase.None => next == TFMMatchFlowPhase.Lobby,
                TFMMatchFlowPhase.Lobby => next == TFMMatchFlowPhase.Queueing || next == TFMMatchFlowPhase.Failed,
                TFMMatchFlowPhase.Queueing => next == TFMMatchFlowPhase.ServerAssignment || next == TFMMatchFlowPhase.Lobby || next == TFMMatchFlowPhase.Failed,
                TFMMatchFlowPhase.ServerAssignment => next == TFMMatchFlowPhase.Connecting || next == TFMMatchFlowPhase.Failed,
                TFMMatchFlowPhase.Connecting => next == TFMMatchFlowPhase.Warmup || next == TFMMatchFlowPhase.Failed,
                TFMMatchFlowPhase.Warmup => next == TFMMatchFlowPhase.Active || next == TFMMatchFlowPhase.Failed,
                TFMMatchFlowPhase.Active => next == TFMMatchFlowPhase.Results || next == TFMMatchFlowPhase.Failed,
                TFMMatchFlowPhase.Results => next == TFMMatchFlowPhase.Returning || next == TFMMatchFlowPhase.Failed,
                TFMMatchFlowPhase.Returning => next == TFMMatchFlowPhase.Lobby,
                TFMMatchFlowPhase.Failed => next == TFMMatchFlowPhase.Lobby,
                _ => false
            };
        }
    }
}
