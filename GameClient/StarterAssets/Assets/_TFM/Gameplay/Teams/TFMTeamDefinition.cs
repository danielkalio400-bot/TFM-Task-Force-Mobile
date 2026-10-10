using System;

namespace TFM.Gameplay.Teams
{
    [Serializable]
    public sealed class TFMTeamDefinition
    {
        public string teamId = "";
        public string displayName = "";
        public int maxPlayers = 5;
    }
}
