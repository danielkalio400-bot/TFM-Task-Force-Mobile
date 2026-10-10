using System;

namespace TFM.Online.Lobby
{
    [Serializable]
    public sealed class TFMLobbyMemberData
    {
        public string playerId = "";
        public string platform = "";
        public bool ready;
    }
}
