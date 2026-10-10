using System;
using System.Collections.Generic;

namespace TFM.UI.Navigation
{
    public sealed class TFMUiNavigationState
    {
        private readonly Stack<TFMScreenId> _history = new();

        public TFMScreenId Current { get; private set; } = TFMScreenId.Boot;
        public event Action<TFMScreenId, TFMScreenId> Changed;

        public void GoTo(TFMScreenId next, bool rememberCurrent = true)
        {
            if (next == Current) return;
            TFMScreenId previous = Current;
            if (rememberCurrent) _history.Push(Current);
            Current = next;
            Changed?.Invoke(previous, next);
        }

        public bool Back()
        {
            if (_history.Count == 0) return false;
            TFMScreenId previous = Current;
            Current = _history.Pop();
            Changed?.Invoke(previous, Current);
            return true;
        }

        public void Reset(TFMScreenId screen = TFMScreenId.MainMenu)
        {
            _history.Clear();
            TFMScreenId previous = Current;
            Current = screen;
            Changed?.Invoke(previous, Current);
        }
    }
}
