using System;

namespace TFM.Online.Spectator
{
    [Serializable]
    public sealed class TFMSpectatorPolicy
    {
        public bool Enabled = true;
        public bool TeamOnly = true;
        public bool FreeCameraAllowed;
        public bool HideSensitiveUi = true;
        public int DelaySeconds;

        public void Normalize()
        {
            DelaySeconds = Math.Clamp(DelaySeconds, 0, 120);
        }
    }
}
