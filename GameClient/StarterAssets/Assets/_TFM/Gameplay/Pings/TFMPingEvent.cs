using System;
using UnityEngine;

namespace TFM.Gameplay.Pings
{
    [Serializable]
    public sealed class TFMPingEvent
    {
        public string PingId = string.Empty;
        public string PlayerId = string.Empty;
        public TFMPingType Type;
        public Vector3 WorldPosition;
        public string RelatedEntityId = string.Empty;
        public long CreatedAtUnixMilliseconds;
    }
}
