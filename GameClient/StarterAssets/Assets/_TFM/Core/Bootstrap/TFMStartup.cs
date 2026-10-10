using TFM.Gameplay.Prototype;
using UnityEngine;

namespace TFM.Core
{
    public static class TFMStartup
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void StartPrototype()
        {
            if (Object.FindFirstObjectByType<TFMPrototypeBootstrap>() != null)
            {
                return;
            }

            GameObject bootstrap = new GameObject("TFM Prototype Bootstrap");
            bootstrap.AddComponent<TFMPrototypeBootstrap>();
        }
    }
}
