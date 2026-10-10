using System;
using TFM.Gameplay.Loadouts;

namespace TFM.Persistence
{
    [Serializable]
    public sealed class TFMPlayerProfileData
    {
        public int schemaVersion = 1;
        public string localProfileId = "";
        public string displayName = "";
        public int level = 1;
        public long experience;
        public TFMLoadoutData activeLoadout = new TFMLoadoutData();

        public void Normalize()
        {
            schemaVersion = Math.Max(1, schemaVersion);
            level = Math.Max(1, level);
            experience = Math.Max(0L, experience);
            if (activeLoadout == null)
            {
                activeLoadout = new TFMLoadoutData();
            }
        }
    }
}
