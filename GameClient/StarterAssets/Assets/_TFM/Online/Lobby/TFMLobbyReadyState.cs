using System;

namespace TFM.Online.Lobby
{
    [Serializable]
    public sealed class TFMLobbyReadyState
    {
        public string lobbyId = "";
        public string playerId = "";
        public bool ready;
    }
}
