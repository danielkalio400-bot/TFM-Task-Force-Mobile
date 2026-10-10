using UnityEngine;

namespace TFM.Gameplay.Practice
{
    // Original training-yard navigation markers; no targeting/tactical metadata.
    public sealed class TFMObjectiveWaypoint : MonoBehaviour
    {
        [SerializeField, Min(0.5f)] private float radius = 1.8f;
        [SerializeField] private int sequence;
        [SerializeField] private Renderer[] visualRenderers;

        public int Sequence { get { return sequence; } }
        public float Radius { get { return radius; } }

        public void Configure(int order, float arrivalRadius)
        {
            sequence = Mathf.Max(0, order);
            radius = Mathf.Max(0.5f, arrivalRadius);
            if (visualRenderers == null || visualRenderers.Length == 0)
                visualRenderers = GetComponentsInChildren<Renderer>();
        }

        public bool ContainsXZ(Vector3 worldPoint)
        {
            Vector3 difference = worldPoint - transform.position;
            difference.y = 0f;
            return difference.sqrMagnitude <= radius * radius;
        }

        public void Show(bool active)
        {
            if (visualRenderers == null) return;
            foreach (Renderer item in visualRenderers)
                if (item != null) item.enabled = active;
        }
    }
}
