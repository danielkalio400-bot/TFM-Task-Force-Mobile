using System;

namespace TFM.Online.Spectator
{
    [Serializable]
    public sealed class TFMSpectatorState
    {
        public string SpectatorPlayerId = string.Empty;
        public string ObservedPlayerId = string.Empty;
        public int ObservedTeamIndex = -1;
        public bool FreeCamera;
        public bool UiVisible = true;
    }
}
