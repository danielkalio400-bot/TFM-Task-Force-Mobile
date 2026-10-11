using UnityEngine;

namespace TFM.World
{
    /// <summary>
    /// Marks an authored combat district. Runtime world systems use this to
    /// omit the old training drills without changing the player's controls.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class TFMWorldIdentity : MonoBehaviour
    {
        [SerializeField] private string worldId = "tfm-district-01";
        [SerializeField] private string displayName = "District 01 — Industrial Quarter";
        public string WorldId => worldId;
        public string DisplayName => displayName;
    }
}
