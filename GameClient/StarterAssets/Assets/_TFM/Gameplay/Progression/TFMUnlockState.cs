using System;

namespace TFM.Gameplay.Progression
{
    [Serializable]
    public sealed class TFMUnlockState
    {
        public string UnlockId = string.Empty;
        public int RequiredLevel;
        public bool Granted;
        public long GrantedAtUnixSeconds;
    }
}
