using System;

namespace TFM.Inventory
{
    [Serializable]
    public sealed class TFMInventoryTransactionReceipt
    {
        public string TransactionId = string.Empty;
        public string PlayerId = string.Empty;
        public string ItemId = string.Empty;
        public int Quantity;
        public string Kind = string.Empty;
        public string AuthoritySource = string.Empty;
        public string SourceId = string.Empty;
        public int BalanceAfter;
        public long CreatedAtUnixSeconds;
    }
}
