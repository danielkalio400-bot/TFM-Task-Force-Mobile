using System;

namespace TFM.Gameplay.Match
{
    public sealed class TFMMatchStateMachine
    {
        public TFMMatchPhase Phase { get; private set; } = TFMMatchPhase.None;
        public event Action<TFMMatchPhase, TFMMatchPhase> PhaseChanged;

        public bool TryTransition(TFMMatchPhase next)
        {
            if (!CanTransition(Phase, next)) return false;

            TFMMatchPhase previous = Phase;
            Phase = next;
            PhaseChanged?.Invoke(previous, next);
            return true;
        }

        public static bool CanTransition(TFMMatchPhase current, TFMMatchPhase next)
        {
            if (current == next) return false;

            switch (current)
            {
                case TFMMatchPhase.None:
                    return next == TFMMatchPhase.Lobby;
                case TFMMatchPhase.Lobby:
                    return next == TFMMatchPhase.Warmup || next == TFMMatchPhase.Shutdown;
                case TFMMatchPhase.Warmup:
                    return next == TFMMatchPhase.Active || next == TFMMatchPhase.Shutdown;
                case TFMMatchPhase.Active:
                    return next == TFMMatchPhase.Overtime ||
                           next == TFMMatchPhase.Results ||
                           next == TFMMatchPhase.Shutdown;
                case TFMMatchPhase.Overtime:
                    return next == TFMMatchPhase.Results || next == TFMMatchPhase.Shutdown;
                case TFMMatchPhase.Results:
                    return next == TFMMatchPhase.Lobby || next == TFMMatchPhase.Shutdown;
                default:
                    return false;
            }
        }
    }
}
