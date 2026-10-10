using UnityEngine;

namespace TFM.Gameplay.Practice
{
    // Local prototype HUD with explicit start/retry, time and progress.
    public sealed class TFMObjectiveRoundHud : MonoBehaviour
    {
        [SerializeField] private TFMObjectiveRound round;
        private GUIStyle _title;
        private GUIStyle _body;
        public void Configure(TFMObjectiveRound activity) { round = activity; }

        private void OnGUI()
        {
            if (round == null || Application.isBatchMode) return;
            if (_title == null)
            {
                _title = new GUIStyle(GUI.skin.label) {
                    alignment = TextAnchor.MiddleCenter, fontStyle = FontStyle.Bold,
                    fontSize = 16
                };
                _title.normal.textColor = Color.white;
                _body = new GUIStyle(GUI.skin.label) {
                    alignment = TextAnchor.MiddleCenter, fontSize = 13
                };
                _body.normal.textColor = Color.white;
            }
            Rect safe = Screen.safeArea;
            float width = Mathf.Min(285f, Mathf.Max(180f, safe.width * 0.43f));
            float height = 216f;
            // Bottom-right, above mobile action buttons.
            Rect panel = new Rect(safe.xMax - width - 12f,
                safe.yMax - height - (Application.isMobilePlatform ? 280f : 18f),
                width, height);
            GUI.Box(panel, GUIContent.none);
            GUI.Label(new Rect(panel.x + 4f, panel.y + 6f, width - 8f, 25f),
                "TFM | WAYPOINT COURSE", _title);
            GUI.Label(new Rect(panel.x + 6f, panel.y + 38f, width - 12f, 24f),
                "Status: " + round.Phase, _body);
            GUI.Label(new Rect(panel.x + 6f, panel.y + 62f, width - 12f, 24f),
                "Progress " + round.CompletedWaypoints + "/" + round.WaypointCount +
                "  |  " + Mathf.CeilToInt(round.RemainingSeconds) + "s", _body);
            GUI.Label(new Rect(panel.x + 6f, panel.y + 86f, width - 12f, 24f),
                "Score " + round.Score + "  |  Best " + round.LocalBest, _body);
            if (round.Phase == TFMObjectiveRoundPhase.Active)
            {
                GUI.Label(new Rect(panel.x + 6f, panel.y + 110f,
                    width - 12f, 25f),
                    "Waypoint " + (round.NextWaypointIndex + 1) +
                    " | " + round.NextWaypointDirection + " | " +
                    Mathf.CeilToInt(round.NextWaypointDistanceMeters) + " m direct",
                    _body);
                GUI.Label(new Rect(panel.x + 6f, panel.y + 136f,
                    width - 12f, 24f),
                    "Last leg: " + round.LastLegSeconds.ToString("0.0") + "s", _body);
                if (GUI.Button(new Rect(panel.x + 12f, panel.y + 169f,
                        width - 24f, 40f), "Stop course"))
                    round.Cancel();
            }
            else
            {
                GUI.Label(new Rect(panel.x + 6f, panel.y + 110f,
                    width - 12f, 25f),
                    "Fastest: " + (round.BestCourseTimeSeconds > 0f
                        ? round.BestCourseTimeSeconds.ToString("0.0") + "s" : "--"),
                    _body);
                GUI.Label(new Rect(panel.x + 6f, panel.y + 137f,
                    width - 12f, 24f),
                    round.NewPersonalBestTime ? "New fastest local course time!" :
                    "Local practice only - no online rank", _body);
                if (GUI.Button(new Rect(panel.x + 12f, panel.y + 169f,
                         width - 24f, 40f), "Start / retry course"))
                    round.Begin();
            }
        }
    }
}
