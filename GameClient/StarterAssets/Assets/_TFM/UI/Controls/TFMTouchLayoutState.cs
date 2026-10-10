using System;

namespace TFM.UI.Controls
{
    [Serializable]
    public sealed class TFMTouchLayoutState
    {
        public float LookSensitivity = 1f;
        public float AimSensitivity = 1f;
        public float GyroSensitivity = 1f;
        public bool GyroEnabled;
        public bool LeftHanded;
        public bool AutoSprint;
        public bool TapToInteract = true;

        public void Normalize()
        {
            LookSensitivity = Math.Clamp(LookSensitivity, 0.1f, 10f);
            AimSensitivity = Math.Clamp(AimSensitivity, 0.1f, 10f);
            GyroSensitivity = Math.Clamp(GyroSensitivity, 0.1f, 10f);
        }
    }
}
