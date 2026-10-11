using TFM.Gameplay.Combat;
using TFM.Player.Controls;
using UnityEngine;

namespace TFM.UI.HUD
{
    public sealed class TFMPrototypeHud : MonoBehaviour
    {
        [SerializeField] private TFMPlayerInput _input;
        [SerializeField] private TFMHitscanWeapon _weapon;
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

            Rect safe=Screen.safeArea;
            Rect area=TFMMobileControlLayout.GuiSafeArea(safe,Screen.height);
            float headerWidth=Mathf.Min(390f,Mathf.Max(165f,area.width*0.58f));
            GUI.Box(new Rect(area.xMin+8f,area.yMin+8f,headerWidth,96f), GUIContent.none);
            GUI.Label(new Rect(area.xMin+18f,area.yMin+17f,
                headerWidth-28f,28f), "TFM · 3D TRAINING YARD", _titleStyle);

            string controls = Application.isMobilePlatform
                ? "Left: move   ·   Right: look   ·   AIM: toggle"
                : "WASD: move · Shift: sprint · Space: jump\nRight mouse: aim/look · Left mouse: fire · R: reload";
            GUI.Label(new Rect(area.xMin+18f,area.yMin+44f,
                headerWidth-28f,52f), controls, _bodyStyle);

            DrawCrosshairAndAmmo();

            if (!Application.isMobilePlatform)
            {
                return;
            }

            Color previousColor = GUI.color;
            GUI.color = new Color(1f, 1f, 1f, 0.35f);
            GUI.Box(TFMMobileControlLayout.MoveZone(safe,Screen.height),
                "MOVE", _zoneStyle);
            GUI.Box(TFMMobileControlLayout.LookZone(safe,Screen.height),
                "LOOK", _zoneStyle);
            GUI.color = previousColor;

            if (_input == null)
            {
                return;
            }

            if (GUI.RepeatButton(
                    TFMMobileControlLayout.Fire(safe,Screen.height),"FIRE"))
            {
                _input.QueueFire();
            }
            if (GUI.Button(
                    TFMMobileControlLayout.Jump(safe,Screen.height),"JUMP"))
            {
                _input.QueueJump();
            }
            if (GUI.Button(
                    TFMMobileControlLayout.Reload(safe,Screen.height),"RELOAD"))
            {
                _input.QueueReload();
            }
            if (GUI.Button(
                    TFMMobileControlLayout.Aim(safe,Screen.height),
                    _input.AimHeld ? "AIM ON" : "AIM"))
            {
                _input.QueueAimToggle();
            }
        }

        private void DrawCrosshairAndAmmo()
        {
            string reticle = _weapon != null && _weapon.HitMarkerVisible ? "×" : "+";
            // Smaller crosshair signals precision view without copying any external HUD.
            _crosshairStyle.fontSize = _input != null && _input.AimHeld ? 22 : 30;
            GUI.Label(
                new Rect(Screen.width * 0.5f - 20f, Screen.height * 0.5f - 24f, 40f, 48f),
                reticle,
                _crosshairStyle);

            if (_weapon == null)
            {
                return;
            }

            string ammo = _weapon.IsReloading
                ? "RELOADING " + Mathf.RoundToInt(_weapon.ReloadProgress * 100f) + "%"
                : $"{_weapon.CurrentAmmo:00} / {_weapon.ReserveAmmo:000}";
            Rect safe=TFMMobileControlLayout.GuiSafeArea(
                Screen.safeArea,Screen.height);
            float width=Mathf.Min(170f,Mathf.Max(100f,safe.width*0.29f));
            GUI.Box(new Rect(safe.xMax-width-8f,safe.yMin+8f,
                width,54f),GUIContent.none);
            GUI.Label(new Rect(safe.xMax-width,safe.yMin+14f,
                width-16f,42f),ammo,_ammoStyle);
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
