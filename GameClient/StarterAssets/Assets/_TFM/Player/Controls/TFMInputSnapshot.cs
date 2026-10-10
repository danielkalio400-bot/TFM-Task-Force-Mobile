using UnityEngine;

namespace TFM.Player.Controls
{
    public readonly struct TFMInputSnapshot
    {
        public TFMInputSnapshot(
            Vector2 move,
            Vector2 look,
            bool jumpPressed,
            bool sprintHeld,
            bool fireHeld,
            bool reloadPressed,
            TFMInputDeviceKind device)
        {
            Move = move;
            Look = look;
            JumpPressed = jumpPressed;
            SprintHeld = sprintHeld;
            FireHeld = fireHeld;
            ReloadPressed = reloadPressed;
            Device = device;
        }

        public Vector2 Move { get; }
        public Vector2 Look { get; }
        public bool JumpPressed { get; }
        public bool SprintHeld { get; }
        public bool FireHeld { get; }
        public bool ReloadPressed { get; }
        public TFMInputDeviceKind Device { get; }
    }
}
