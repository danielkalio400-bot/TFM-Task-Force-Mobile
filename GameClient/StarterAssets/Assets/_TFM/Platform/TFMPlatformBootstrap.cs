using UnityEngine;

namespace TFM.Platform
{
    public static class TFMPlatformBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Install()
        {
            if (Object.FindFirstObjectByType<TFMFrameRatePolicy>() != null)
            {
                return;
            }

            GameObject root = new GameObject("TFM Platform Services");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<TFMFrameRatePolicy>();
        }
    }
}
