using System;

namespace TFM.Gameplay.Inventory
{
    [Serializable]
    public sealed class TFMInventoryTransaction
    {
        public string TransactionId = string.Empty;
        public string PlayerId = string.Empty;
        public string ItemId = string.Empty;
        public int Quantity;
        public TFMInventoryMutationKind Kind;
        public string AuthoritySource = string.Empty;
        public long CreatedAtUnixSeconds;
    }
}
