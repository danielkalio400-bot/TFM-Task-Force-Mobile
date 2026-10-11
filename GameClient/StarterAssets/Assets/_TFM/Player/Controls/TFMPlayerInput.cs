#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using EnhancedTouch = UnityEngine.InputSystem.EnhancedTouch.Touch;
using EnhancedTouchSupport = UnityEngine.InputSystem.EnhancedTouch.EnhancedTouchSupport;
#endif
using UnityEngine;

namespace TFM.Player.Controls
{
    [DefaultExecutionOrder(-200)]
    public sealed class TFMPlayerInput : MonoBehaviour
    {
        private const float DefaultTouchRadius = 120f;
        [SerializeField, Range(0.25f, 2f)] private float touchLookSensitivity=1f;

        private int _leftFinger = -1;
        private int _rightFinger = -1;
        private Vector2 _leftStart;
        private bool _jumpQueued;
        private bool _fireQueued;
        private bool _reloadQueued;
        private bool _aimToggleQueued;
        private bool _aimToggled;
        private TFMGyroAimBridge _gyro;
#if ENABLE_INPUT_SYSTEM
        private bool _enabledEnhancedTouch;
#endif

        public Vector2 Move { get; private set; }
        public Vector2 Look { get; private set; }
        public bool JumpPressed { get; private set; }
        public bool SprintHeld { get; private set; }
        public bool FireHeld { get; private set; }
        public bool ReloadPressed { get; private set; }
        public bool AimHeld { get; private set; }
        public TFMInputDeviceKind ActiveDevice { get; private set; } = TFMInputDeviceKind.Unknown;

        private void Awake()
        {
            _gyro = GetComponent<TFMGyroAimBridge>();
        }

#if ENABLE_INPUT_SYSTEM
        private void OnEnable()
        {
            if (!EnhancedTouchSupport.enabled)
            {
                EnhancedTouchSupport.Enable();
                _enabledEnhancedTouch = true;
            }
        }

#endif

        private void OnDisable()
        {
#if ENABLE_INPUT_SYSTEM
            if (_enabledEnhancedTouch && EnhancedTouchSupport.enabled)
            {
                EnhancedTouchSupport.Disable();
            }
            _enabledEnhancedTouch=false;
#endif
            ResetTransientInput();
        }

        private void ResetTransientInput()
        {
            _leftFinger=-1;
            _rightFinger=-1;
            _leftStart=Vector2.zero;
            _jumpQueued=_fireQueued=_reloadQueued=_aimToggleQueued=false;
            _aimToggled=false;
            Move=Look=Vector2.zero;
            JumpPressed=SprintHeld=FireHeld=ReloadPressed=AimHeld=false;
            ActiveDevice=TFMInputDeviceKind.Unknown;
        }

        public void QueueJump() => _jumpQueued = true;
        public void QueueFire() => _fireQueued = true;
        public void QueueReload() => _reloadQueued = true;
        // Touch HUD switches between hip view and aim view. PC uses hold right mouse.
        public void QueueAimToggle() => _aimToggleQueued = true;

        private void Update()
        {
            Vector2 move = Vector2.zero;
            Vector2 look = Vector2.zero;
            bool jump = false;
            bool sprint = false;
            bool fire = false;
            bool reload = false;
            bool aim = false;

#if ENABLE_INPUT_SYSTEM
            ReadInputSystem(ref move, ref look, ref jump, ref sprint, ref fire, ref reload, ref aim);
#elif ENABLE_LEGACY_INPUT_MANAGER
            ReadLegacyInput(ref move, ref look, ref jump, ref sprint, ref fire, ref reload, ref aim);
#endif

            if (_gyro != null && _gyro.IsAvailable && _gyro.LookDelta.sqrMagnitude > 0.000001f)
            {
                look += _gyro.LookDelta;
                ActiveDevice = TFMInputDeviceKind.Touch;
            }

            Move = Vector2.ClampMagnitude(move, 1f);
            Look = ActiveDevice == TFMInputDeviceKind.Touch
                ? Vector2.ClampMagnitude(look * touchLookSensitivity,48f)
                : look;
            JumpPressed = jump || _jumpQueued;
            SprintHeld = sprint;
            FireHeld = fire || _fireQueued;
            ReloadPressed = reload || _reloadQueued;
            if (_aimToggleQueued) _aimToggled = !_aimToggled;
            AimHeld = aim || _aimToggled;
            _jumpQueued = false;
            _fireQueued = false;
            _reloadQueued = false;
            _aimToggleQueued = false;
        }

#if ENABLE_INPUT_SYSTEM
        private void ReadInputSystem(
            ref Vector2 move,
            ref Vector2 look,
            ref bool jump,
            ref bool sprint,
            ref bool fire,
            ref bool reload,
            ref bool aim)
        {
            Keyboard keyboard = Keyboard.current;
            if (keyboard != null)
            {
                float horizontal = ReadAxis(keyboard.aKey.isPressed, keyboard.dKey.isPressed) +
                                   ReadAxis(keyboard.leftArrowKey.isPressed, keyboard.rightArrowKey.isPressed);
                float vertical = ReadAxis(keyboard.sKey.isPressed, keyboard.wKey.isPressed) +
                                 ReadAxis(keyboard.downArrowKey.isPressed, keyboard.upArrowKey.isPressed);

                Vector2 keyboardMove = Vector2.ClampMagnitude(new Vector2(horizontal, vertical), 1f);
                bool keyboardUsed = keyboardMove.sqrMagnitude > 0f ||
                                    keyboard.spaceKey.wasPressedThisFrame ||
                                    keyboard.leftShiftKey.isPressed ||
                                    keyboard.rightShiftKey.isPressed ||
                                    keyboard.rKey.wasPressedThisFrame;
                if (keyboardUsed)
                {
                    move = keyboardMove;
                    ActiveDevice = TFMInputDeviceKind.KeyboardMouse;
                }

                jump |= keyboard.spaceKey.wasPressedThisFrame;
                sprint |= keyboard.leftShiftKey.isPressed || keyboard.rightShiftKey.isPressed;
                reload |= keyboard.rKey.wasPressedThisFrame;
            }

            Mouse mouse = Mouse.current;
            // Mobile Input System can synthesize a mouse from a finger.
            // Prevent move/look touches firing the weapon accidentally.
            if (mouse != null && !Application.isMobilePlatform)
            {
                if (mouse.rightButton.isPressed)
                {
                    aim = true;
                    look = mouse.delta.ReadValue();
                    ActiveDevice = TFMInputDeviceKind.KeyboardMouse;
                }

                if (mouse.leftButton.isPressed)
                {
                    fire = true;
                    ActiveDevice = TFMInputDeviceKind.KeyboardMouse;
                }
            }

            Gamepad gamepad = Gamepad.current;
            if (gamepad != null)
            {
                Vector2 padMove = gamepad.leftStick.ReadValue();
                Vector2 padLook = gamepad.rightStick.ReadValue();
                bool padUsed = padMove.sqrMagnitude > 0.0025f ||
                               padLook.sqrMagnitude > 0.0025f ||
                               gamepad.buttonSouth.wasPressedThisFrame ||
                               gamepad.rightTrigger.ReadValue() > 0.2f ||
                               gamepad.leftTrigger.ReadValue() > 0.2f ||
                               gamepad.buttonWest.wasPressedThisFrame;

                if (padUsed)
                {
                    move = padMove;
                    look = padLook * 12f;
                    jump |= gamepad.buttonSouth.wasPressedThisFrame;
                    sprint |= gamepad.leftStickButton.isPressed;
                    fire |= gamepad.rightTrigger.ReadValue() > 0.5f;
                    aim |= gamepad.leftTrigger.ReadValue() > 0.5f;
                    reload |= gamepad.buttonWest.wasPressedThisFrame;
                    ActiveDevice = TFMInputDeviceKind.Controller;
                }
            }

            ReadEnhancedTouches(ref move, ref look);
        }

        private void ReadEnhancedTouches(ref Vector2 move, ref Vector2 look)
        {
            bool leftSeen = false;
            bool rightSeen = false;

            foreach (EnhancedTouch touch in EnhancedTouch.activeTouches)
            {
                int finger = touch.finger.index;
                Vector2 position = touch.screenPosition;
                bool ended = touch.phase == UnityEngine.InputSystem.TouchPhase.Ended ||
                             touch.phase == UnityEngine.InputSystem.TouchPhase.Canceled;

                if (touch.phase == UnityEngine.InputSystem.TouchPhase.Began)
                {
                    ClaimFinger(finger, position);
                }

                if (finger == _leftFinger)
                {
                    leftSeen = true;
                    if (ended)
                    {
                        _leftFinger = -1;
                    }
                    else
                    {
                        move = Vector2.ClampMagnitude((position - _leftStart) / TouchRadius(), 1f);
                        ActiveDevice = TFMInputDeviceKind.Touch;
                    }
                }
                else if (finger == _rightFinger)
                {
                    rightSeen = true;
                    if (ended)
                    {
                        _rightFinger = -1;
                    }
                    else
                    {
                        look = touch.delta;
                        ActiveDevice = TFMInputDeviceKind.Touch;
                    }
                }
            }

            if (_leftFinger >= 0 && !leftSeen) _leftFinger = -1;
            if (_rightFinger >= 0 && !rightSeen) _rightFinger = -1;
        }
#endif

#if ENABLE_LEGACY_INPUT_MANAGER
        private void ReadLegacyInput(
            ref Vector2 move,
            ref Vector2 look,
            ref bool jump,
            ref bool sprint,
            ref bool fire,
            ref bool reload)
        {
            move = Vector2.ClampMagnitude(
                new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical")), 1f);
            jump = Input.GetButtonDown("Jump");
            sprint = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);
            fire = !Application.isMobilePlatform && Input.GetMouseButton(0);
            aim = !Application.isMobilePlatform && Input.GetMouseButton(1);
            reload = Input.GetKeyDown(KeyCode.R);

            if (move.sqrMagnitude > 0f || jump || sprint || fire || reload)
            {
                ActiveDevice = TFMInputDeviceKind.KeyboardMouse;
            }

            if (Input.GetMouseButton(1))
            {
                look = new Vector2(Input.GetAxis("Mouse X"), Input.GetAxis("Mouse Y")) * 12f;
                ActiveDevice = TFMInputDeviceKind.KeyboardMouse;
            }

            bool leftSeen = false;
            bool rightSeen = false;
            for (int index = 0; index < Input.touchCount; index++)
            {
                Touch touch = Input.GetTouch(index);
                int finger = touch.fingerId;
                bool ended = touch.phase == UnityEngine.TouchPhase.Ended ||
                             touch.phase == UnityEngine.TouchPhase.Canceled;

                if (touch.phase == UnityEngine.TouchPhase.Began)
                {
                    ClaimFinger(finger, touch.position);
                }

                if (finger == _leftFinger)
                {
                    leftSeen = true;
                    if (ended) _leftFinger = -1;
                    else
                    {
                        move = Vector2.ClampMagnitude((touch.position - _leftStart) / TouchRadius(), 1f);
                        ActiveDevice = TFMInputDeviceKind.Touch;
                    }
                }
                else if (finger == _rightFinger)
                {
                    rightSeen = true;
                    if (ended) _rightFinger = -1;
                    else
                    {
                        look = touch.deltaPosition;
                        ActiveDevice = TFMInputDeviceKind.Touch;
                    }
                }
            }

            if (_leftFinger >= 0 && !leftSeen) _leftFinger = -1;
            if (_rightFinger >= 0 && !rightSeen) _rightFinger = -1;
        }
#endif

        private void ClaimFinger(int finger, Vector2 position)
        {
            Rect safe=Screen.safeArea;
            if (!safe.Contains(position) ||
                TFMMobileControlLayout.IsActionTouch(position,safe,Screen.height))
                return;
            float halfway=safe.center.x;
            if (position.x < halfway && _leftFinger < 0)
            {
                _leftFinger = finger;
                _leftStart = position;
            }
            else if (position.x >= halfway && _rightFinger < 0)
            {
                _rightFinger = finger;
            }
        }

         private static float ReadAxis(bool negative, bool positive)
        {
            return (positive ? 1f : 0f) - (negative ? 1f : 0f);
        }

        private static float TouchRadius()
        {
            if (Screen.dpi <= 0f) return DefaultTouchRadius;
            return Mathf.Clamp(Screen.dpi * 0.55f, 80f, 180f);
        }
    }
}
