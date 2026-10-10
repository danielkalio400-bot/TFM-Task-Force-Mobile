using System;

namespace TFM.Gameplay.BattleRoyale
{
    [Serializable]
    public sealed class TFMBattleRoyaleRuntimeState
    {
        public int ConnectedPlayers;
        public int ActivePlayers;
        public int ActiveTeams;
        public int ZoneStage;
        public float ZoneRadiusMeters = 1500f;
        public float NextZoneRadiusMeters = 1000f;
        public double SecondsUntilZoneTransition = 120d;
        public bool FinalStage;

        public void Normalize()
        {
            ConnectedPlayers = Math.Clamp(ConnectedPlayers, 0, 100);
            ActivePlayers = Math.Clamp(ActivePlayers, 0, ConnectedPlayers);
            ActiveTeams = Math.Max(0, ActiveTeams);
            ZoneStage = Math.Max(0, ZoneStage);
            ZoneRadiusMeters = Math.Max(0f, ZoneRadiusMeters);
            NextZoneRadiusMeters = Math.Clamp(NextZoneRadiusMeters, 0f, ZoneRadiusMeters);
            SecondsUntilZoneTransition = Math.Max(0d, SecondsUntilZoneTransition);
        }
    }
}
