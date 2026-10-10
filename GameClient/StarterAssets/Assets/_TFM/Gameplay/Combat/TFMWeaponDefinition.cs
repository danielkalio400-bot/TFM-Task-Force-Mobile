using UnityEngine;

namespace TFM.Gameplay.Combat
{
    [CreateAssetMenu(menuName = "TFM/Combat/Weapon Definition", fileName = "WeaponDefinition")]
    public sealed class TFMWeaponDefinition : ScriptableObject
    {
        [SerializeField] private string weaponId = "prototype";
        [SerializeField] private string displayName = "Prototype";
        [SerializeField, Min(1)] private int damagePoints = 25;
        [SerializeField, Min(1)] private int capacity = 30;
        [SerializeField, Min(0)] private int startingReserve = 90;
        [SerializeField, Min(0.1f)] private float actionsPerSecond = 8f;
        [SerializeField, Min(0.1f)] private float reloadSeconds = 1.8f;
        [SerializeField, Min(1f)] private float gameplayRange = 100f;

        public string WeaponId => weaponId;
        public string DisplayName => displayName;
        public int DamagePoints => damagePoints;
        public int Capacity => capacity;
        public int StartingReserve => startingReserve;
        public float ActionsPerSecond => actionsPerSecond;
        public float ReloadSeconds => reloadSeconds;
        public float GameplayRange => gameplayRange;
    }
}
