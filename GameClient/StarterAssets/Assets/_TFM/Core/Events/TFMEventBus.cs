using System;
using System.Collections.Generic;

namespace TFM.Core.Events
{
    public static class TFMEventBus
    {
        private static readonly Dictionary<Type, Delegate> Handlers = new Dictionary<Type, Delegate>();

        public static void Subscribe<T>(Action<T> handler)
        {
            if (handler == null) throw new ArgumentNullException(nameof(handler));
            Type type = typeof(T);
            Handlers.TryGetValue(type, out Delegate current);
            Handlers[type] = Delegate.Combine(current, handler);
        }

        public static void Unsubscribe<T>(Action<T> handler)
        {
            if (handler == null) return;
            Type type = typeof(T);
            if (!Handlers.TryGetValue(type, out Delegate current)) return;

            Delegate next = Delegate.Remove(current, handler);
            if (next == null)
            {
                Handlers.Remove(type);
            }
            else
            {
                Handlers[type] = next;
            }
        }

        public static void Publish<T>(T message)
        {
            if (Handlers.TryGetValue(typeof(T), out Delegate current) && current is Action<T> action)
            {
                action.Invoke(message);
            }
        }

        public static void Clear()
        {
            Handlers.Clear();
        }
    }
}
