using System;

namespace TFM.Gameplay.Combat
{
    [Serializable]
    public sealed class TFMWeaponRuntimeState
    {
        public string weaponId = "";
        public int loaded;
        public int reserve;
        public bool reloading;

        public void Initialize(TFMWeaponDefinition definition)
        {
            if (definition == null) throw new ArgumentNullException(nameof(definition));
            weaponId = definition.WeaponId;
            loaded = definition.Capacity;
            reserve = definition.StartingReserve;
            reloading = false;
        }
    }
}
