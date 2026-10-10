using System;
using UnityEngine;

namespace TFM.Networking
{
    [Serializable]
    public struct TFMPlayerNetworkSnapshot
    {
        public long sequence;
        public double serverTime;
        public Vector3 position;
        public Quaternion rotation;
        public Vector3 velocity;

        public static TFMPlayerNetworkSnapshot Interpolate(
            TFMPlayerNetworkSnapshot from,
            TFMPlayerNetworkSnapshot to,
            double targetTime)
        {
            double duration = to.serverTime - from.serverTime;
            float t = duration <= 0d
                ? 1f
                : Mathf.Clamp01((float)((targetTime - from.serverTime) / duration));

            return new TFMPlayerNetworkSnapshot
            {
                sequence = to.sequence,
                serverTime = targetTime,
                position = Vector3.LerpUnclamped(from.position, to.position, t),
                rotation = Quaternion.SlerpUnclamped(from.rotation, to.rotation, t),
                velocity = Vector3.LerpUnclamped(from.velocity, to.velocity, t)
            };
        }
    }
}
