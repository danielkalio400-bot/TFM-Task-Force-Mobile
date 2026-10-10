using TFM.Gameplay.Combat;
using TFM.Player.Controls;
using UnityEngine;

namespace TFM.UI.HUD
{
    public sealed class TFMPrototypeHud : MonoBehaviour
    {
        private TFMPlayerInput _input;
        private TFMHitscanWeapon _weapon;
        private GUIStyle _titleStyle;
        private GUIStyle _bodyStyle;
        private GUIStyle _zoneStyle;
        private GUIStyle _crosshairStyle;
        private GUIStyle _ammoStyle;

        public void Configure(TFMPlayerInput input, TFMHitscanWeapon weapon)
        {
            _input = input;
            _weapon = weapon;
        }

        private void OnGUI()
        {
            EnsureStyles();

            GUI.Box(new Rect(16f, 16f, 390f, 96f), GUIContent.none);
            GUI.Label(new Rect(30f, 25f, 320f, 28f), "TFM · 3D TRAINING YARD", _titleStyle);

            string controls = Application.isMobilePlatform
                ? "Left: move   ·   Right: look   ·   FIRE: shoot"
                : "WASD: move · Shift: sprint · Space: jump\nRight mouse: look · Left mouse: fire · R: reload";
            GUI.Label(new Rect(30f, 52f, 360f, 52f), controls, _bodyStyle);

            DrawCrosshairAndAmmo();

            if (!Application.isMobilePlatform)
            {
                return;
            }

            Color previousColor = GUI.color;
            GUI.color = new Color(1f, 1f, 1f, 0.35f);
            GUI.Box(new Rect(20f, Screen.height - 165f, 145f, 130f), "MOVE", _zoneStyle);
            GUI.Box(
                new Rect(Screen.width - 165f, Screen.height * 0.5f - 65f, 145f, 130f),
                "LOOK",
                _zoneStyle);
            GUI.color = previousColor;

            if (_input == null)
            {
                return;
            }

            if (GUI.RepeatButton(
                    new Rect(Screen.width - 130f, Screen.height - 260f, 104f, 78f),
                    "FIRE"))
            {
                _input.QueueFire();
            }
            if (GUI.Button(
                    new Rect(Screen.width - 250f, Screen.height - 145f, 96f, 64f),
                    "JUMP"))
            {
                _input.QueueJump();
            }
            if (GUI.Button(
                    new Rect(Screen.width - 250f, Screen.height - 225f, 96f, 54f),
                    "RELOAD"))
            {
                _input.QueueReload();
            }
        }

        private void DrawCrosshairAndAmmo()
        {
            string reticle = _weapon != null && _weapon.HitMarkerVisible ? "×" : "+";
            GUI.Label(
                new Rect(Screen.width * 0.5f - 20f, Screen.height * 0.5f - 24f, 40f, 48f),
                reticle,
                _crosshairStyle);

            if (_weapon == null)
            {
                return;
            }

            string ammo = _weapon.IsReloading
                ? "RELOADING"
                : $"{_weapon.CurrentAmmo:00} / {_weapon.ReserveAmmo:000}";
            GUI.Box(new Rect(Screen.width - 188f, 18f, 170f, 54f), GUIContent.none);
            GUI.Label(new Rect(Screen.width - 178f, 24f, 150f, 42f), ammo, _ammoStyle);
        }

        private void EnsureStyles()
        {
            if (_titleStyle != null)
            {
                return;
            }

            _titleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 18,
                fontStyle = FontStyle.Bold
            };
            _titleStyle.normal.textColor = Color.white;

            _bodyStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 13,
                wordWrap = true
            };
            _bodyStyle.normal.textColor = new Color(0.86f, 0.9f, 0.94f);

            _zoneStyle = new GUIStyle(GUI.skin.box)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 15,
                fontStyle = FontStyle.Bold
            };

            _crosshairStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 30,
                fontStyle = FontStyle.Bold
            };
            _crosshairStyle.normal.textColor = Color.white;

            _ammoStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 19,
                fontStyle = FontStyle.Bold
            };
            _ammoStyle.normal.textColor = new Color(1f, 0.77f, 0.2f);
        }
    }
}
