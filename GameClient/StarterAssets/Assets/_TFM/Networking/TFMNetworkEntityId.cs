using System;

namespace TFM.Networking
{
    [Serializable]
    public struct TFMNetworkEntityId : IEquatable<TFMNetworkEntityId>
    {
        public string value;

        public TFMNetworkEntityId(string value)
        {
            this.value = value ?? string.Empty;
        }

        public bool Equals(TFMNetworkEntityId other)
        {
            return string.Equals(value, other.value, StringComparison.Ordinal);
        }

        public override bool Equals(object obj)
        {
            return obj is TFMNetworkEntityId other && Equals(other);
        }

        public override int GetHashCode()
        {
            return value == null ? 0 : value.GetHashCode();
        }

        public override string ToString()
        {
            return value ?? string.Empty;
        }
    }
}
