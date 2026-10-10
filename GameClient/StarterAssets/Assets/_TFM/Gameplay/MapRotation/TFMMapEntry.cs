using System;

namespace TFM.Gameplay.MapRotation
{
    [Serializable]
    public sealed class TFMMapEntry
    {
        public string MapId = string.Empty;
        public string DisplayName = string.Empty;
        public string[] SupportedModeIds = Array.Empty<string>();
        public int Weight = 1;
        public bool Enabled = true;
    }
}
