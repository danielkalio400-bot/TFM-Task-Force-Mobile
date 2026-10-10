using System;

namespace TFM.Gameplay.Modes
{
    [Serializable]
    public sealed class TFMModeRuleDefinition
    {
        public string ModeId = string.Empty;
        public string DisplayName = string.Empty;
        public TFMModeRuleKind RuleKind;
        public int MinimumPlayers = 2;
        public int MaximumPlayers = 10;
        public int TeamSize = 5;
        public int ScoreLimit = 50;
        public int RoundLimit = 1;
        public int TimeLimitSeconds = 600;
        public bool RankedEligible;
        public bool RespawnEnabled = true;
        public int RespawnDelaySeconds = 3;
        public string[] ObjectiveIds = Array.Empty<string>();

        public void Normalize()
        {
            MinimumPlayers = Math.Clamp(MinimumPlayers, 1, 100);
            MaximumPlayers = Math.Clamp(MaximumPlayers, MinimumPlayers, 100);
            TeamSize = Math.Clamp(TeamSize, 1, MaximumPlayers);
            ScoreLimit = Math.Clamp(ScoreLimit, 1, 10000);
            RoundLimit = Math.Clamp(RoundLimit, 1, 100);
            TimeLimitSeconds = Math.Clamp(TimeLimitSeconds, 60, 7200);
            RespawnDelaySeconds = Math.Clamp(RespawnDelaySeconds, 0, 60);
            ObjectiveIds ??= Array.Empty<string>();
        }
    }
}
