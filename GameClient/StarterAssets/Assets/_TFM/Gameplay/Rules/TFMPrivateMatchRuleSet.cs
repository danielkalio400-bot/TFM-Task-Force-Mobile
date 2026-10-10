using System;

namespace TFM.Gameplay.Rules
{
    [Serializable]
    public sealed class TFMPrivateMatchRuleSet
    {
        public string ModeId = string.Empty;
        public TFMMatchPrivacy Privacy = TFMMatchPrivacy.InviteOnly;
        public int MaxPlayers = 10;
        public int TeamSize = 5;
        public int ScoreLimit = 50;
        public int TimeLimitSeconds = 600;
        public bool FriendlyFire;
        public bool AllowBots = true;
        public bool AllowSpectators = true;
        public bool AllowJoinInProgress;
        public TFMRespawnPolicy RespawnPolicy = TFMRespawnPolicy.ModeDefined;
        public int RespawnDelaySeconds = 3;

        public void Normalize()
        {
            MaxPlayers = Math.Clamp(MaxPlayers, 2, 100);
            TeamSize = Math.Clamp(TeamSize, 1, MaxPlayers);
            ScoreLimit = Math.Clamp(ScoreLimit, 1, 10000);
            TimeLimitSeconds = Math.Clamp(TimeLimitSeconds, 60, 7200);
            RespawnDelaySeconds = Math.Clamp(RespawnDelaySeconds, 0, 60);
        }
    }
}
