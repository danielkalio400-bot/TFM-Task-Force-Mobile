using System;

namespace TFM.Gameplay.Maps
{
    [Serializable]
    public sealed class TFMMapDescriptor
    {
        public string MapId = string.Empty;
        public string DisplayName = string.Empty;
        public TFMMapCategory Category;
        public bool OriginalDesignRequired = true;
        public bool SceneImplemented;
        public bool MobileValidated;
        public bool PcValidated;
        public string[] SupportedModeIds = Array.Empty<string>();
    }
}
