using System.Collections;
using TFM.Gameplay.Combat;
using TFM.Gameplay.Teams;
using UnityEngine;

namespace TFM.Gameplay.Spawn
{
    public sealed class TFMRespawnController : MonoBehaviour
    {
        [SerializeField] private TFMHealth health;
        [SerializeField] private TFMSpawnRegistry spawnRegistry;
        [SerializeField] private TFMTeamMember teamMember;
        [SerializeField, Min(0f)] private float delaySeconds = 3f;

        private int _respawnSequence;

        public TFMRespawnState State { get; private set; } = TFMRespawnState.Alive;

        private void Awake()
        {
            if (health == null) health = GetComponent<TFMHealth>();
            if (teamMember == null) teamMember = GetComponent<TFMTeamMember>();
        }

        private void OnEnable()
        {
            if (health != null) health.Depleted += OnDepleted;
        }

        private void OnDisable()
        {
            if (health != null) health.Depleted -= OnDepleted;
        }

        private void OnDepleted(TFMDamageInfo _)
        {
            if (State != TFMRespawnState.Alive) return;
            StartCoroutine(RespawnAfterDelay());
        }

        private IEnumerator RespawnAfterDelay()
        {
            State = TFMRespawnState.Waiting;
            yield return new WaitForSeconds(delaySeconds);
            State = TFMRespawnState.Respawning;

            TFMSpawnPoint point = spawnRegistry != null
                ? spawnRegistry.Select(teamMember, ++_respawnSequence)
                : null;

            if (point != null)
            {
                CharacterController controller = GetComponent<CharacterController>();
                if (controller != null) controller.enabled = false;
                transform.SetPositionAndRotation(point.transform.position, point.transform.rotation);
                if (controller != null) controller.enabled = true;
            }

            health?.ResetHealth();
            State = TFMRespawnState.Alive;
        }
    }
}
