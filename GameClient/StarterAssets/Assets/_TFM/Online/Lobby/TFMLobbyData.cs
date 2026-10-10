using System;

namespace TFM.Online.Lobby
{
    [Serializable]
    public sealed class TFMLobbyData
    {
        public string lobbyId = "";
        public string ownerPlayerId = "";
        public int maxPlayers = 4;
        public TFMLobbyMemberData[] members = Array.Empty<TFMLobbyMemberData>();
    }
}
