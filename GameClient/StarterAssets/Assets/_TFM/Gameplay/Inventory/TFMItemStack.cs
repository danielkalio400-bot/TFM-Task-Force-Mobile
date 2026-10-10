using System;

namespace TFM.Gameplay.Inventory
{
    [Serializable]
    public sealed class TFMItemStack
    {
        public string itemId;
        public int quantity;

        public TFMItemStack(string itemId, int quantity)
        {
            this.itemId = itemId;
            this.quantity = Math.Max(0, quantity);
        }
    }
}
