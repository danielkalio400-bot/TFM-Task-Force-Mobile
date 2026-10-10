using System;

namespace TFM.Networking
{
    public sealed class TFMSessionLifecycle
    {
        public TFMSessionPhase Phase { get; private set; } = TFMSessionPhase.Offline;
        public string LastError { get; private set; } = string.Empty;

        public event Action<TFMSessionPhase, TFMSessionPhase> Changed;

        public bool TryMove(TFMSessionPhase next, string error = "")
        {
            if (!CanMove(Phase, next)) return false;
            TFMSessionPhase previous = Phase;
            Phase = next;
            LastError = next == TFMSessionPhase.Failed ? error ?? string.Empty : string.Empty;
            Changed?.Invoke(previous, next);
            return true;
        }

        public static bool CanMove(TFMSessionPhase current, TFMSessionPhase next)
        {
            if (current == next) return false;

            switch (current)
            {
                case TFMSessionPhase.Offline:
                    return next == TFMSessionPhase.Connecting;
                case TFMSessionPhase.Connecting:
                    return next == TFMSessionPhase.Lobby || next == TFMSessionPhase.Failed;
                case TFMSessionPhase.Lobby:
                    return next == TFMSessionPhase.AllocatingServer ||
                           next == TFMSessionPhase.Leaving ||
                           next == TFMSessionPhase.Failed;
                case TFMSessionPhase.AllocatingServer:
                    return next == TFMSessionPhase.JoiningMatch ||
                           next == TFMSessionPhase.Lobby ||
                           next == TFMSessionPhase.Failed;
                case TFMSessionPhase.JoiningMatch:
                    return next == TFMSessionPhase.InMatch ||
                           next == TFMSessionPhase.Reconnecting ||
                           next == TFMSessionPhase.Failed;
                case TFMSessionPhase.InMatch:
                    return next == TFMSessionPhase.Reconnecting ||
                           next == TFMSessionPhase.Leaving ||
                           next == TFMSessionPhase.Failed;
                case TFMSessionPhase.Reconnecting:
                    return next == TFMSessionPhase.InMatch ||
                           next == TFMSessionPhase.Leaving ||
                           next == TFMSessionPhase.Failed;
                case TFMSessionPhase.Leaving:
                    return next == TFMSessionPhase.Offline;
                case TFMSessionPhase.Failed:
                    return next == TFMSessionPhase.Offline || next == TFMSessionPhase.Connecting;
                default:
                    return false;
            }
        }
    }
}
