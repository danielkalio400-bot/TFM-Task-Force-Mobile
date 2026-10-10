using System;
using UnityEngine;

namespace TFM.Gameplay.Combat
{
    [Serializable]
    public struct TFMDamageInfo
    {
        public int amount;
        public TFMDamageKind kind;
        public string sourceEntityId;
        public string sourceTeamId;
        public Vector3 hitPoint;

        public TFMDamageInfo(
            int amount,
            TFMDamageKind kind,
            string sourceEntityId,
            string sourceTeamId,
            Vector3 hitPoint)
        {
            this.amount = Mathf.Max(0, amount);
            this.kind = kind;
            this.sourceEntityId = sourceEntityId ?? string.Empty;
            this.sourceTeamId = sourceTeamId ?? string.Empty;
            this.hitPoint = hitPoint;
        }
    }
}
