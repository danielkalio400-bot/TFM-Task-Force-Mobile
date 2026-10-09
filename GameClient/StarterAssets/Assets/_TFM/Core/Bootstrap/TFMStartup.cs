using UnityEngine;

namespace TFM.Core
{
    // Minimal startup marker; this does not make a playable game.
    public class TFMStartup : MonoBehaviour
    {
        private void Start()
        {
            Debug.Log("TFM scaffold loaded. Gameplay systems not yet implemented.");
        }
    }
}