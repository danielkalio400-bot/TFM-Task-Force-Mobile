using System;
using System.Collections.Generic;
using UnityEngine;

namespace TFM.Gameplay.Inventory
{
    public sealed class TFMInventory : MonoBehaviour
    {
        [SerializeField, Min(1)] private int maxDistinctItems = 24;
        [SerializeField] private List<TFMItemStack> items = new List<TFMItemStack>();

        public IReadOnlyList<TFMItemStack> Items => items;
        public event Action Changed;

        public bool Add(string itemId, int quantity)
        {
            if (string.IsNullOrWhiteSpace(itemId) || quantity <= 0) return false;

            TFMItemStack existing = items.Find(item => item.itemId == itemId);
            if (existing != null)
            {
                existing.quantity += quantity;
                Changed?.Invoke();
                return true;
            }

            if (items.Count >= maxDistinctItems) return false;

            items.Add(new TFMItemStack(itemId, quantity));
            Changed?.Invoke();
            return true;
        }

        public bool Remove(string itemId, int quantity)
        {
            if (string.IsNullOrWhiteSpace(itemId) || quantity <= 0) return false;

            TFMItemStack existing = items.Find(item => item.itemId == itemId);
            if (existing == null || existing.quantity < quantity) return false;

            existing.quantity -= quantity;
            if (existing.quantity == 0)
            {
                items.Remove(existing);
            }

            Changed?.Invoke();
            return true;
        }

        public int Count(string itemId)
        {
            TFMItemStack existing = items.Find(item => item.itemId == itemId);
            return existing?.quantity ?? 0;
        }

        public void Clear()
        {
            if (items.Count == 0) return;
            items.Clear();
            Changed?.Invoke();
        }
    }
}
