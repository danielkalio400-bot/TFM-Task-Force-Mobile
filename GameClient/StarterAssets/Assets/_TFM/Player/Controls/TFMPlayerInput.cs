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

        private int _leftFinger = -1;
        private int _rightFinger = -1;
        private Vector2 _leftStart;
        private bool _jumpQueued;
        private bool _fireQueued;
        private bool _reloadQueued;
#if ENABLE_INPUT_SYSTEM
        private bool _enabledEnhancedTouch;
#endif

        public Vector2 Move { get; private set; }
        public Vector2 Look { get; private set; }
        public bool JumpPressed { get; private set; }
        public bool SprintHeld { get; private set; }
        public bool FireHeld { get; private set; }
        public bool ReloadPressed { get; private set; }

#if ENABLE_INPUT_SYSTEM
        private void OnEnable()
        {
            if (!EnhancedTouchSupport.enabled)
            {
                EnhancedTouchSupport.Enable();
                _enabledEnhancedTouch = true;
            }
        }

        private void OnDisable()
        {
            if (_enabledEnhancedTouch && EnhancedTouchSupport.enabled)
            {
                EnhancedTouchSupport.Disable();
            }
        }
#endif

        public void QueueJump()
        {
            _jumpQueued = true;
        }

        public void QueueFire()
        {
            _fireQueued = true;
        }

        public void QueueReload()
        {
            _reloadQueued = true;
        }

        private void Update()
        {
            Vector2 move = Vector2.zero;
            Vector2 look = Vector2.zero;
            bool jump = false;
            bool sprint = false;
            bool fire = false;
            bool reload = false;

#if ENABLE_INPUT_SYSTEM
            ReadInputSystem(ref move, ref look, ref jump, ref sprint, ref fire, ref reload);
#elif ENABLE_LEGACY_INPUT_MANAGER
            ReadLegacyInput(ref move, ref look, ref jump, ref sprint, ref fire, ref reload);
#endif

            Move = Vector2.ClampMagnitude(move, 1f);
            Look = look;
            JumpPressed = jump || _jumpQueued;
            SprintHeld = sprint;
            FireHeld = fire || _fireQueued;
            ReloadPressed = reload || _reloadQueued;
            _jumpQueued = false;
            _fireQueued = false;
            _reloadQueued = false;
        }

#if ENABLE_INPUT_SYSTEM
        private void ReadInputSystem(
            ref Vector2 move,
            ref Vector2 look,
            ref bool jump,
            ref bool sprint,
            ref bool fire,
            ref bool reload)
        {
            Keyboard keyboard = Keyboard.current;
            if (keyboard != null)
            {
                float horizontal = ReadAxis(keyboard.aKey.isPressed, keyboard.dKey.isPressed) +
                                   ReadAxis(keyboard.leftArrowKey.isPressed, keyboard.rightArrowKey.isPressed);
                float vertical = ReadAxis(keyboard.sKey.isPressed, keyboard.wKey.isPressed) +
                                 ReadAxis(keyboard.downArrowKey.isPressed, keyboard.upArrowKey.isPressed);
                move = Vector2.ClampMagnitude(new Vector2(horizontal, vertical), 1f);
                jump = keyboard.spaceKey.wasPressedThisFrame;
                sprint = keyboard.leftShiftKey.isPressed || keyboard.rightShiftKey.isPressed;
                reload = keyboard.rKey.wasPressedThisFrame;
            }

            Mouse mouse = Mouse.current;
            if (mouse != null && mouse.rightButton.isPressed)
            {
                look = mouse.delta.ReadValue();
            }
            if (mouse != null)
            {
                fire = mouse.leftButton.isPressed;
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
                    }
                }
            }

            if (_leftFinger >= 0 && !leftSeen)
            {
                _leftFinger = -1;
            }
            if (_rightFinger >= 0 && !rightSeen)
            {
                _rightFinger = -1;
            }
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
            fire = Input.GetMouseButton(0);
            reload = Input.GetKeyDown(KeyCode.R);

            if (Input.GetMouseButton(1))
            {
                look = new Vector2(Input.GetAxis("Mouse X"), Input.GetAxis("Mouse Y")) * 12f;
            }

            bool leftSeen = false;
            bool rightSeen = false;
            for (int index = 0; index < Input.touchCount; index++)
            {
                Touch touch = Input.GetTouch(index);
                int finger = touch.fingerId;
                bool ended = touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled;

                if (touch.phase == TouchPhase.Began)
                {
                    ClaimFinger(finger, touch.position);
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
                        move = Vector2.ClampMagnitude((touch.position - _leftStart) / TouchRadius(), 1f);
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
                        look = touch.deltaPosition;
                    }
                }
            }

            if (_leftFinger >= 0 && !leftSeen)
            {
                _leftFinger = -1;
            }
            if (_rightFinger >= 0 && !rightSeen)
            {
                _rightFinger = -1;
            }
        }
#endif

        private void ClaimFinger(int finger, Vector2 position)
        {
            if (position.x < Screen.width * 0.5f && _leftFinger < 0)
            {
                _leftFinger = finger;
                _leftStart = position;
            }
            else if (position.x >= Screen.width * 0.5f &&
                     !IsMobileButtonZone(position) &&
                     _rightFinger < 0)
            {
                _rightFinger = finger;
            }
        }

        private static bool IsMobileButtonZone(Vector2 position)
        {
            return position.x > Screen.width * 0.62f && position.y < 270f;
        }

        private static float ReadAxis(bool negative, bool positive)
        {
            return (positive ? 1f : 0f) - (negative ? 1f : 0f);
        }

        private static float TouchRadius()
        {
            if (Screen.dpi <= 0f)
            {
                return DefaultTouchRadius;
            }

            return Mathf.Clamp(Screen.dpi * 0.55f, 80f, 180f);
        }
    }
}
