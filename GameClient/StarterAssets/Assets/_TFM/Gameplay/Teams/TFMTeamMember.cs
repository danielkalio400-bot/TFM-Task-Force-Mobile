using UnityEngine;

namespace TFM.Gameplay.Teams
{
    public sealed class TFMTeamMember : MonoBehaviour
    {
        [SerializeField] private string teamId = "";

        public string TeamId => teamId;

        public void Assign(string value)
        {
            teamId = value ?? string.Empty;
        }
    }
}
