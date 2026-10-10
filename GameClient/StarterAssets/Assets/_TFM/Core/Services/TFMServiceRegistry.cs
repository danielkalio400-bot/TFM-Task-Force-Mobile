using System;
using System.Collections.Generic;

namespace TFM.Core.Services
{
    public static class TFMServiceRegistry
    {
        private static readonly Dictionary<Type, object> Services = new Dictionary<Type, object>();

        public static void Register<T>(T service) where T : class
        {
            if (service == null) throw new ArgumentNullException(nameof(service));
            Services[typeof(T)] = service;
        }

        public static bool TryResolve<T>(out T service) where T : class
        {
            if (Services.TryGetValue(typeof(T), out object value) && value is T typed)
            {
                service = typed;
                return true;
            }

            service = null;
            return false;
        }

        public static T Resolve<T>() where T : class
        {
            if (TryResolve(out T service)) return service;
            throw new InvalidOperationException($"TFM service not registered: {typeof(T).FullName}");
        }

        public static void Remove<T>() where T : class
        {
            Services.Remove(typeof(T));
        }

        public static void Clear()
        {
            Services.Clear();
        }
    }
}
