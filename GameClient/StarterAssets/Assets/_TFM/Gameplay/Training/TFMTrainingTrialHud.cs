using UnityEngine;

namespace TFM.Gameplay.Training
{
    // Development-only, resolution-aware UI; production should migrate to
    // UGUI or UI Toolkit with measured mobile touch-target accessibility.
    public sealed class TFMTrainingTrialHud : MonoBehaviour
    {
        [SerializeField] private TFMTrainingTrial trial;
        private GUIStyle _header;
        private GUIStyle _details;

        public void Configure(TFMTrainingTrial controller) { trial = controller; }

        private void OnGUI()
        {
            if (trial == null || Application.isBatchMode) return;
            if (_header == null)
            {
                _header = new GUIStyle(GUI.skin.label) {
                    alignment = TextAnchor.MiddleCenter, fontSize = 17,
                    fontStyle = FontStyle.Bold
                };
                _header.normal.textColor = Color.white;
                _details = new GUIStyle(GUI.skin.label) {
                    alignment = TextAnchor.MiddleCenter, fontSize = 13,
                    wordWrap = true
                };
                _details.normal.textColor = Color.white;
            }

            Rect safe = Screen.safeArea;
            float width = Mathf.Min(320f, safe.width - 20f);
            float height = trial.Phase == TFMTrainingTrialPhase.Running ? 176f : 190f;
            // Above the right-side touch actions and below device status bar.
            Rect panel = new Rect(safe.center.x - width * 0.5f,
                safe.yMin + (Application.isMobilePlatform ? 8f : 14f), width, height);
            GUI.Box(panel, GUIContent.none);
            GUI.Label(new Rect(panel.x + 8f, panel.y + 8f, width - 16f, 28f),
                "TFM | MOVING TARGET PRACTICE", _header);

            string headline = trial.Phase == TFMTrainingTrialPhase.Running
                ? "TIME  " + Mathf.CeilToInt(trial.RemainingTime) + "s   TARGETS  " +
                  trial.TargetsCleared + "/" + trial.TotalTargets
                : "STATE  " + trial.Phase.ToString().ToUpperInvariant();
            GUI.Label(new Rect(panel.x + 10f, panel.y + 40f, width - 20f, 28f),
                headline, _details);
            GUI.Label(new Rect(panel.x + 10f, panel.y + 63f, width - 20f, 28f),
                "Shots " + trial.ShotsFired + " | Hits " + trial.ShotsHit +
                " | Misses " + trial.ShotsMissed +
                " | Accuracy " + Mathf.RoundToInt(trial.Accuracy * 100f) + "%", _details);
            GUI.Label(new Rect(panel.x + 10f, panel.y + 90f, width - 20f, 25f),
                "Hit streak " + trial.CurrentHitStreak + " | Longest " +
                trial.LongestHitStreak, _details);

            if (trial.Phase == TFMTrainingTrialPhase.Running)
            {
                if (GUI.Button(new Rect(panel.x + width * 0.25f, panel.y + 130f,
                    width * 0.5f, 40f), "End trial"))
                    trial.Cancel();
            }
            else
            {
                GUI.Label(new Rect(panel.x + 10f, panel.y + 112f, width - 20f, 25f),
                    "Score " + trial.Score + " | Best " + trial.LocalBestScore +
                    " | Practice " + trial.PracticeMedal, _details);
                if (GUI.Button(new Rect(panel.x + width * 0.22f,
                    panel.y + 143f, width * 0.56f, 40f), "Start / retry"))
                    trial.Begin();
            }
        }
    }
}
