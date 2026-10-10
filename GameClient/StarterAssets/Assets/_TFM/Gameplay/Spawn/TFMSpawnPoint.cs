using TFM.Gameplay.Teams;
using UnityEngine;

namespace TFM.Gameplay.Spawn
{
    public sealed class TFMSpawnPoint : MonoBehaviour
    {
        [SerializeField] private string spawnId = "";
        [SerializeField] private string teamId = "";

        public string SpawnId => string.IsNullOrWhiteSpace(spawnId) ? name : spawnId;
        public string TeamId => teamId;

        public bool IsEligible(TFMTeamMember team)
        {
            return string.IsNullOrEmpty(teamId) ||
                   team == null ||
                   string.IsNullOrEmpty(team.TeamId) ||
                   team.TeamId == teamId;
        }
    }
}
