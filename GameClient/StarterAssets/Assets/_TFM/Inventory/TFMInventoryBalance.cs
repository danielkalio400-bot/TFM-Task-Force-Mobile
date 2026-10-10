using System;

namespace TFM.Inventory
{
    [Serializable]
    public sealed class TFMInventoryBalance
    {
        public string PlayerId = string.Empty;
        public string ItemId = string.Empty;
        public int Quantity;
    }
}
