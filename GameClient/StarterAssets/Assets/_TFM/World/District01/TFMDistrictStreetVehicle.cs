using UnityEngine;

namespace TFM.World.District01
{
    // Scene-authored offline road vehicle with stoplight/obstacle reactions.
    // Reuses a single physics raycast buffer and makes no runtime render assets.
    [RequireComponent(typeof(BoxCollider))]
    [DisallowMultipleComponent]
    public sealed class TFMDistrictStreetVehicle : MonoBehaviour
    {
        [SerializeField] private TFMDistrictTrafficSignal signal;
        [SerializeField] private Vector3 start;
        [SerializeField] private Vector3 finish;
        [SerializeField] private bool northSouth;
        [SerializeField, Range(2f, 8f)] private float speed = 4.1f;
        private readonly RaycastHit[] _hits = new RaycastHit[24];
        private Vector3 _direction;
        private float _velocity;
        private bool _ready;

        public void Configure(TFMDistrictTrafficSignal junction, Vector3 origin,
            Vector3 destination, bool vertical, float metersPerSecond)
        {
            signal = junction;
            start = origin;
            finish = destination;
            northSouth = vertical;
            speed = Mathf.Clamp(metersPerSecond, 2f, 8f);
            transform.position = start;
            _direction = (finish - start).normalized;
            _ready = true;
            transform.rotation = Quaternion.LookRotation(_direction);
        }

        private void Awake()
        {
            _direction = (finish - start).normalized;
            _ready = _direction.sqrMagnitude > 0.5f;
        }

        private void Update()
        {
            if (!_ready) return;
            float remaining = Vector3.Distance(transform.position, finish);
            if (remaining < 0.25f)
            {
                _velocity = 0f;
                transform.position = start;
                return;
            }
            bool red = signal != null &&
                (northSouth ? !signal.NorthSouthGreen : !signal.EastWestGreen);
            // District junction: centre X=0, Z=24. Only wait before the line,
            // never freeze a car in the middle of an intersection.
            float untilJunction = northSouth ?
                (24f - transform.position.z) * _direction.z :
                (0f - transform.position.x) * _direction.x;
            bool redAhead = red && untilJunction > 4.4f && untilJunction < 10f;

            Vector3 rayOrigin = transform.position + Vector3.up * 1.1f +
                _direction * 1.45f;
            int n = Physics.RaycastNonAlloc(rayOrigin, _direction, _hits, 4.0f,
                ~(1 << 2), QueryTriggerInteraction.Ignore);
            bool blocked = false;
            for (int i = 0; i < n; i++)
            {
                Collider other = _hits[i].collider;
                if (other == null || other.transform.IsChildOf(transform)) continue;
                blocked = true;
                break;
            }
            float targetSpeed = redAhead || blocked ? 0f : speed;
            _velocity = Mathf.MoveTowards(_velocity, targetSpeed,
                (targetSpeed < _velocity ? 14f : 5f) * Time.deltaTime);
            float step = Mathf.Min(remaining, _velocity * Time.deltaTime);
            transform.position += _direction * step;
        }
    }
}
