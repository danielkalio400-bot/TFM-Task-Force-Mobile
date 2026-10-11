using UnityEngine;

namespace TFM.Player.Controls
{
    /// <summary>
    /// Single source of truth for mobile HUD touch regions. Rects use Unity
    /// IMGUI top-left coordinates; touches are bottom-left screen positions.
    /// No gameplay or server-side input authority is implied.
    /// </summary>
    public static class TFMMobileControlLayout
    {
        public static Rect GuiSafeArea(Rect safe, float screenHeight)
        {
            return new Rect(safe.xMin, screenHeight - safe.yMax,
                safe.width, safe.height);
        }

        public static float Scale(Rect safe)
        {
            return Mathf.Clamp(Mathf.Min(safe.width / 850f,
                safe.height / 390f), 0.60f, 1.30f);
        }

        public static Rect Fire(Rect safe, float screenHeight)
        {
            Rect rect=GuiSafeArea(safe,screenHeight);
            float s=Scale(safe);
            return new Rect(rect.xMax-118f*s,rect.yMax-260f*s,104f*s,78f*s);
        }

        public static Rect Jump(Rect safe, float screenHeight)
        {
            Rect rect=GuiSafeArea(safe,screenHeight);
            float s=Scale(safe);
            return new Rect(rect.xMax-245f*s,rect.yMax-145f*s,96f*s,64f*s);
        }

        public static Rect Reload(Rect safe, float screenHeight)
        {
            Rect rect=GuiSafeArea(safe,screenHeight);
            float s=Scale(safe);
            return new Rect(rect.xMax-245f*s,rect.yMax-225f*s,96f*s,54f*s);
        }

        public static Rect Aim(Rect safe, float screenHeight)
        {
            Rect rect=GuiSafeArea(safe,screenHeight);
            float s=Scale(safe);
            // Separate from right-hand fire, jump, reload and look regions.
            return new Rect(rect.xMax-355f*s,rect.yMax-285f*s,94f*s,58f*s);
        }

        public static Rect MoveZone(Rect safe,float screenHeight)
        {
            Rect rect=GuiSafeArea(safe,screenHeight);
            float s=Scale(safe);
            return new Rect(rect.xMin+20f*s,rect.yMax-165f*s,145f*s,130f*s);
        }

        public static Rect LookZone(Rect safe,float screenHeight)
        {
            Rect rect=GuiSafeArea(safe,screenHeight);
            float s=Scale(safe);
            return new Rect(rect.xMax-165f*s,rect.center.y-65f*s,145f*s,130f*s);
        }

        public static bool IsActionTouch(Vector2 bottomLeftPosition,Rect safe,
            float screenHeight)
        {
            if(!safe.Contains(bottomLeftPosition))return false;
            Vector2 topLeft=new Vector2(bottomLeftPosition.x,
                screenHeight-bottomLeftPosition.y);
            float margin=9f*Scale(safe);
            return Expanded(Fire(safe,screenHeight),margin).Contains(topLeft) ||
                Expanded(Jump(safe,screenHeight),margin).Contains(topLeft) ||
                Expanded(Reload(safe,screenHeight),margin).Contains(topLeft) ||
                Expanded(Aim(safe,screenHeight),margin).Contains(topLeft);
        }

        private static Rect Expanded(Rect r,float margin)
        {
            return Rect.MinMaxRect(r.xMin-margin,r.yMin-margin,
                r.xMax+margin,r.yMax+margin);
        }
    }
}
