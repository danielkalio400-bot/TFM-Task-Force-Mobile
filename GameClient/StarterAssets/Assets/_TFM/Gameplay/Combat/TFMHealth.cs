using System;
using UnityEngine;

namespace TFM.Gameplay.Combat
{
    public sealed class TFMHealth : MonoBehaviour
    {
        [SerializeField, Min(1)] private int maxHealth = 100;
        [SerializeField] private bool resetOnEnable = true;

        public int MaxHealth => maxHealth;
        public int CurrentHealth { get; private set; }
        public bool IsAlive => CurrentHealth > 0;

        public event Action<int, int> HealthChanged;
        public event Action<TFMDamageInfo> Damaged;
        public event Action<TFMDamageInfo> Depleted;

        private void Awake()
        {
            ResetHealth();
        }

        private void OnEnable()
        {
            if (resetOnEnable)
            {
                ResetHealth();
            }
        }

        public bool ApplyDamage(TFMDamageInfo info)
        {
            if (!IsAlive || info.amount <= 0)
            {
                return false;
            }

            int before = CurrentHealth;
            CurrentHealth = Mathf.Max(0, CurrentHealth - info.amount);
            if (CurrentHealth != before)
            {
                HealthChanged?.Invoke(CurrentHealth, maxHealth);
                Damaged?.Invoke(info);
            }

            if (CurrentHealth == 0)
            {
                Depleted?.Invoke(info);
            }

            return true;
        }

        public void Restore(int amount)
        {
            if (amount <= 0 || !IsAlive)
            {
                return;
            }

            int before = CurrentHealth;
            CurrentHealth = Mathf.Min(maxHealth, CurrentHealth + amount);
            if (CurrentHealth != before)
            {
                HealthChanged?.Invoke(CurrentHealth, maxHealth);
            }
        }

        public void ResetHealth()
        {
            CurrentHealth = Mathf.Max(1, maxHealth);
            HealthChanged?.Invoke(CurrentHealth, maxHealth);
        }
    }
}
