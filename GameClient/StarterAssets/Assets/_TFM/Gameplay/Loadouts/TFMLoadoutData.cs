using System;

namespace TFM.Gameplay.Loadouts
{
    [Serializable]
    public sealed class TFMLoadoutData
    {
        public string loadoutId = "default";
        public string primaryWeaponId = "";
        public string secondaryWeaponId = "";
        public string tacticalItemId = "";
        public string equipmentItemId = "";
        public string perkAId = "";
        public string perkBId = "";
        public string perkCId = "";
    }
}
